#! /usr/bin/env node
function saved() {

  const fs = require('fs');
  const { exec } = require('child_process');
  const inquirer = require("inquirer");

  const FSMETA_CONFIG = process.env.XDG_CONFIG_HOME + '/.fsmeta';

  const nextFunctions = [
    'open',
    'rename'
  ]

  const bridge = 'Adobe\\ Bridge\\ 2022.app';
  const photoshop = 'Adobe\\ Photoshop\\ 2022.app';
  const preview = 'Preview.app';

  const appChoices = [
    bridge,
    photoshop,
    preview
  ]

  let imgChoices = [];

  const renameFile = () => {
    inquirer.prompt([
      { name: 'renamefile', message: 'Rename File?', type: 'list', choices: imgChoices },
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
      { name: 'openfile', message: 'Open File?', type: 'list', choices: imgChoices },
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

  fs.readdir(`${FSMETA_CONFIG}`, (err, _files)=> {
    if (err)
      throw err;
    else {
      inquirer.prompt([
        { name: 'searchFile', message: 'Choose Search History?', type: 'list', choices: _files },
      ])
      .then(answer => {
        let filePath = FSMETA_CONFIG + '/' + answer.searchFile;
        returnFileData(filePath)
          .then(buffer => {
            let data = buffer.toString();
            let images = data.split('\n\n');
            images.forEach(image => {
              let imgD = image.split('\n');
              let img = imgD[0];
              console.log(image)
              imgChoices.push(img)
            })
            setTimeout(()=> {
              inquirer.prompt([
                { name: 'nextfunc', message: 'Next Function?', type: 'list', choices: nextFunctions }
              ])
              .then(ans => {
                if (ans.nextfunc === 'rename')
                  renameFile()
                if (ans.nextfunc === 'open')
                  openFile()
              })
            }, 500)
          })
      })
    }
  })

}
module.exports = saved