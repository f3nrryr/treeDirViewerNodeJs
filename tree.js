// Домашнее задание
// Tree Node.js File System

// Цель:
// использовать Node.js API файловы системы;
// применять асинхронные паттерны программирования в JavaScript.


// Описание/Пошаговая инструкция выполнения домашнего задания:
// Напишите NodeJS скрипт tree для вывода списка файлов и папок файловой системы.

// Приложение должно принимать аргумент каталога для анализа и флаг --depth, -d с номером глубины директорий.
// Результатом является вывод данных в структурированном виде дерева, аналогично упражнению Tree Function.
// Вызовы файловой системы должны быть асинхронными.
// Например, при вызове скрипта с аргументом ./node, вывод может быть следующим:

// tree ./node -d 2
// node
// ├── cluster
// │   └── index.js
// ├── domain
// │   ├── error.js
// │   ├── flow.js
// │   └── run.js
// ├── errors
// │   ├── counter.js
// │   └── try-catch.js
// └── worker
//     └── index.js

// 4 directories, 7 files
// Пожалуйста, прикрепите ссылку на Pull Request в вашем репозитории на Github.

const fsPromises = require('fs/promises'); // типа using'а в Шарпе. По умолчанию Node.js применяет систему модулей CommonJS, 
// которая рассматривает отдельный файл как модуль, для загрузки модулей применяет функцию require(), в которую передается название модуля
const path = require('path');

async function main() {
    //slice(2) отрезает путь к node.js и путь к файлу скрипта, они тут неинтересны.
    const args = process.argv.slice(2); //При запуске приложения из терминала/командной строки мы можем передавать ему параметры. 
    // Для получения параметров в коде приложения применяется массив process.argv. Это аналогично тому, как в языках C/C++/C#/Java в функцию main передается набор аргументов 
    // в виде строкового массива.

    let directory = '.';
    let depth = Infinity;

    for (let i = 0; i < args.length; i++) {

        const arg = args[i];

        if (arg === '--depth' || arg === '-d') {

            depth = parseInt(args[i + 1], 10);

            if (isNaN(depth) || depth < 0) {
                console.error('Глубина задаётся положительным целым числом или 0.');
                process.exit();
            }
            
            i++; // делаем доп. инкремент, т.к. мы перескочили от ключа -d или --depth к значению и, по сути, прошли 2 итерации вместо 1.

        } else if (!arg.startsWith('-')) {
            directory = arg;
        }

    }

    console.log(directory);

    const counts = await drawTree(directory, depth);
    console.log(`\n${counts.directories} directories, ${counts.files} files`);
}

main().catch(console.error);

async function drawTree(directory, depth, currentDepth = 0, prefix = '') {

    if (currentDepth > depth) return { files: 0, directories: 0 }; // корень рекурсии.

    try {
        
        const fileNamesOnlyName = await fsPromises.readdir(directory); // fs.readdir возвращает массив входящих в папку файлов и папок 
        // (просто имена, БЕЗ ПУТИ). читает, начиная с текущей директории, где лежит скрипт.js

        //Метод map() позволяет трансформировать один массив в другой при помощи функций-колбэка. 
        // Переданная функция будет вызвана для каждого элемента массива по порядку. Из результатов вызова функции будет собран новый массив.

        const fileStatsForGetIsDirectory = await Promise
                                                 .all
                                                 (fileNamesOnlyName
                                                    .map
                                                    (fileName => fsPromises.stat(path.join(directory, fileName))
                                                    )
                                                );
        let filesCount = 0;
        let dirsCount = 0;
        const filesAndDirsInfo = [];

        for (let i = 0; i < fileNamesOnlyName.length; i++) {
            const fileOrDirName = fileNamesOnlyName[i];
            const fileOrDirStat = fileStatsForGetIsDirectory[i];
            const isLast = i === fileNamesOnlyName.length - 1;

            if (fileOrDirStat.isDirectory()) {
                dirsCount++;
                filesAndDirsInfo.push({ name: fileOrDirName, isDirectory: true, isLast });
            } else {
                filesCount++;
                filesAndDirsInfo.push({ name: fileOrDirName, isDirectory: false, isLast });
            }
        }

        for (let i = 0; i < filesAndDirsInfo.length; i++) {

            const fileOrDir = filesAndDirsInfo[i];
            const connectorStr = fileOrDir.isLast ? '└── ' : '├── ';
            const newPrefixStr = fileOrDir.isLast ? '    ' : '│   ';

            console.log(prefix + connectorStr + fileOrDir.name);

            if (fileOrDir.isDirectory) {
                const subCounts = await drawTree(
                    path.join(directory, fileOrDir.name),
                    depth,
                    currentDepth + 1,
                    prefix + newPrefixStr
                );

                filesCount += subCounts.files;
                dirsCount += subCounts.directories;
            }
        }

        return { files: filesCount, directories: dirsCount };

    } catch (error) {
        console.error(`Ошибка при чтении директории ${directory}`);
        console.error(error.message);
        return { files: 0, directories: 0 };
    }
}