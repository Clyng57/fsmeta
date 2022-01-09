#! /usr/bin/env node
function search() {

  const fs = require('fs');
  const path = require('path');
  const exifParser = require('exif-parser');
  const chalk = require('chalk');
  const { exec } = require('child_process');
  const inquirer = require("inquirer");
  const Spinner = require('cli-spinner').Spinner;
  const spinner = new Spinner('processing.. %s');

  const FSMETA_CONFIG = process.env.XDG_CONFIG_HOME + '/.fsmeta';

  const initialQuestions = [
    {
      name: 'directory',
      message: 'Directory Path?',
      type: 'input'
    },
    {
      name: 'keyword',
      message: 'Keyword?',
      type: 'input'
    }
  ]

  const nextFunctions = [
    'open',
    'rename',
    'save'
  ]

  const stockPhotos = '/Volumes/Company/Graphics/Image Downloads/Stock Photos';
  const bridge = 'Adobe\\ Bridge\\ 2022.app';
  const photoshop = 'Adobe\\ Photoshop\\ 2022.app';
  const preview = 'Preview.app';

  const appChoices = [
    bridge,
    photoshop,
    preview
  ]

  const matchedFiles = [];
  const matchedFilesDescription = [];
  let matchCounter = 0;

  const writeErrors = _error => {
    fs.appendFile( `./errors.js`, _error, err => {
      if (err) 
        throw err;
    })
  }

  const saveSearch = keyword => {
    let fileTitle = FSMETA_CONFIG + '/' + keyword;
    fs.access(`${FSMETA_CONFIG}`, error => {
      if (error) {
        fs.mkdir(`${FSMETA_CONFIG}`, error => {
          if (error)
            throw error;
        })
      }
    })
    setTimeout(()=> {
      let matches = matchedFilesDescription.join('\n\n');
      matches = matches.toString();
      fs.writeFile(`${fileTitle}.txt`, matches, err => {
        if (err) 
          throw err;
      })
    }, 500)
  }

  const renameFile = () => {
    inquirer.prompt([
      { name: 'renamefile', message: 'Rename File?', type: 'list', choices: matchedFiles },
      { name: 'newname', message: 'New File Name? NOTE: Include path before name.', type: 'input' }
    ])
    .then(secondAnswer => {
      let _rawFile = secondAnswer.renamefile.replace(/[0-9]*\. /g, '');
      fs.rename(`${_rawFile}`, `${secondAnswer.newname}`, err => {
        if (err)
          console.error(err)
      })
      goBacktoRename()
    })
  }

  const openFile = () => {
    inquirer.prompt([
      { name: 'openfile', message: 'Open File?', type: 'list', choices: matchedFiles },
      { name: 'app', message: 'Which App?', type: 'list', choices: appChoices }
    ])
    .then(secondAnswer => {
      let _rawFile = secondAnswer.openfile.replace(/[0-9]*\. /g, '');
      exec(`open -a ${secondAnswer.app} "${_rawFile}"`, err => {
        if (err)
          console.error(err)
      })
    goBacktoOpen()
    })
  }

  let exitCall = false;

  const goBacktoOpen = () => {
    inquirer.prompt([
      { name: 'backexit', message: 'Go Back to Open File?', type: 'confirm' }
    ])
    .then(thirdAnswer => {
      if (thirdAnswer.backexit === true) 
        openFile()
      else if (exitCall !== true) {
        exitCall = true;
        goBacktoRename()
      }
    })
  }

  const goBacktoRename = () => {
    inquirer.prompt([
      { name: 'backexit', message: 'Go Back to Rename File?', type: 'confirm' }
    ])
    .then(thirdAnswer => {
      if (thirdAnswer.backexit === true) 
        renameFile()
      else if (exitCall !== true) {
        exitCall = true;
        goBacktoOpen()
      }
    })
  }

  const handleFile = (fileCount, fileLength, keyword)=> {
    let fileCountLength = fileCount.length;
    if (fileCountLength === fileLength) {
      spinner.stop();
      setTimeout(()=> {
        inquirer.prompt([
          { name: 'nextfunc', message: 'Next Function?', type: 'list', choices: nextFunctions }
        ])
        .then(answer => {
          if (answer.nextfunc === 'rename')
            renameFile()
          if (answer.nextfunc === 'open')
            openFile()
          if (answer.nextfunc === 'save')
            saveSearch(keyword)
        })
      }, 500)
    }
  }

  const resultHandler = (Parser, _file, keyword, fileCount) => {
    try {
      Parser.enableImageSize([false]);
      const Result = Parser.parse();
      if (Result.tags.ImageDescription) {
        let checkDescription = Result.tags.ImageDescription;
        checkDescription = checkDescription.toString();
        if (checkDescription.includes(keyword)) {
          matchCounter += 1;
          console.log(
            '\n' + matchCounter + '. ' + chalk.magentaBright.bold(_file),
            '\n' + Result.tags.ImageDescription + '\n'
          );
            matchedFiles.push(matchCounter + '. ' + _file)
            matchedFilesDescription.push(matchCounter + '. ' + _file + '\nDescription:' + Result.tags.ImageDescription)
        }
        fileCount.push('A');
      } else {
        fileCount.push('A');
      }
    } catch (err) {
      fileCount.push('A');
      let _error = err;
      //_error = _error.toString();
      //writeErrors(_error)
      return;
    }
  }

  const returnParser = (buffer) => {
    const Parser = exifParser.create(buffer);
      return Parser;
  }

  const returnFileData = (_file) => {
    return new Promise((resolve, reject) => {
      fs.readFile(_file, (err, buffer) => {
        if (err) {
          reject(err)
          return
        }
        resolve(buffer)
      })
    })
  }

  const searchFiles = (_files, _path, keyword)=> {
    let fileCount = [];
    let fileLength = _files.length;
    _files.forEach(_file => {
      if (fileCount.length === 0) {
        spinner.setSpinnerString('⠁⠉⠙⠚⠒⠂⠂⠒⠲⠴⠤⠄⠄⠤⠴⠲⠒⠂⠂⠒⠚⠙⠉⠁');
        spinner.start();
      }
      _file = _path + '/' + _file; 
      let fileExt = path.extname(_file);
      let isaFile = fs.statSync(`${_file}`).isFile();
      if (fileExt === '.png' || fileExt === '.jpg' && isaFile) {
        returnFileData(_file)
          .then( buffer => returnParser(buffer) )
          .then( Parser => resultHandler(Parser, _file, keyword, fileCount) )
          .then( ()=> {
            handleFile(fileCount, fileLength, keyword) 
          })
          .catch( err => { 
            let _error = err;
            //writeErrors(_error)
          })
      } else {
        fileCount.push('A');
      }
    })
  }

  inquirer
    .prompt( initialQuestions )
    .then(answer => {
      let pathEntered = answer.directory;
      let _path = pathEntered === 'Stock Photos' ? stockPhotos : pathEntered;
      let keyword = answer.keyword;
      fs.readdir(`${_path}`, (err, _files)=> {
        if (err)
          throw err;
        else {
          searchFiles(_files, _path, keyword)
        }
      })
    })

}
module.exports = search