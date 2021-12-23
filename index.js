const chalk = require('chalk');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const glob = require("glob");
const tea = require('mta-tea');
const crypto = require('crypto');
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

let getDirectories = (src, callback) => {
    glob(src + '/**/*', callback);
}

const spinner = ora('Processing resource').start();

const extensions = ['.col', '.txd', '.dff']

getDirectories(argv.res, (err, res) => {
    if (err) {
        spinner.fail('Something went wrong!')
    } else {
        let files = res.filter(element => fs.lstatSync(path.resolve(__dirname, element)).isFile() && extensions.includes(path.extname(element)))
        spinner.succeed()
        files.forEach(file => {
            const key = crypto.createHash('sha256').update(argv.password).digest("hex").toUpperCase();
            const data = fs.readFileSync(file)
            const encoded = tea.encode(data, key);
            fs.writeFileSync(file + 'c', encoded, { flag: 'w+', encoding: 'base64' })
        });
    }
})