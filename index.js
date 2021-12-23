const chalk = require('chalk');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const glob = require("glob");

const error = chalk.bold.red;

const argv = yargs(hideBin(process.argv))
.usage('Usage: $0 -password [pass] -res [path]')
.example('$0 -password encryptme -res test_resource', 'Encrypt test_resource')
.options('password', {
    alias: 'p',
    describe: 'Password for the encryption',
    type: 'string',
    coerce: arg =>
    arg && arg.length >= 6 ? arg : undefined
})
.options('res', {
    alias: 'r',
    describe: 'Resource folder path',
    type: 'string',
    coerce: arg =>
    arg && fs.existsSync(path.resolve(__dirname, arg)) && fs.lstatSync(path.resolve(__dirname, arg)).isDirectory() ? arg : undefined
})
.demandOption(['password'], error("Include password with 6 symbols or more!"))
.demandOption(['res'], error("Incorrect or no resource folder selected!"))
.argv;

// const spinner = ora('Processing resource').start();
// spinner.succeed()

let getDirectories = (src, callback) => {
    glob(src + '/**/*', callback);
}

getDirectories(argv.res, (err, res) => {
    if (err) {
        console.log('Error', err);
    //   spinner.fail()
    } else {
        res.filter(element => fs.lstatSync(path.resolve(__dirname, element)).isFile()).forEach(name => console.log(name));
    }
})
// fs.readdirSync(argv.res).forEach(name => console.log(name))
// console.log(argv.password, argv.res);
