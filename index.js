#! /usr/bin/env node

const { program } = require('commander');
const search = require('./lib/search');
const saved = require('./lib/saved');

program
  .version('0.0.1')

program
  .command('search')
  .description('enter path, keyword, and search the directory')
  .action(search)

program
  .command('saved')
  .description('find saved searches')
  .action(saved)

program
  .parse()