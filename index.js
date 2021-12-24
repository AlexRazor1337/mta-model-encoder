const chalk = require('chalk');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs');
const fse = require('fs-extra')
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
.options('backup', {
    alias: 'b',
    describe: 'Backup folder for resources',
    type: 'string',
    coerce: arg =>
    arg && fs.existsSync(path.resolve(__dirname, arg)) && fs.lstatSync(path.resolve(__dirname, arg)).isDirectory() ? arg : undefined
})
.options('meta', {
    alias: 'm',
    describe: 'Replace file extensions in meta',
    type: 'boolean'
})
.demandOption(['password'], error("Include password with 6 symbols or more!"))
.demandOption(['res'], error("Incorrect or no resource folder selected!"))
.argv;

let getDirectories = (src, callback) => {
    glob(src + '/**/*', callback);
}

const extensions = ['.col', '.txd', '.dff']

let spinner = ora('Getting files list').start();
getDirectories(argv.res, (err, res) => {
    if (err) {
        spinner.fail('Something went wrong!')
    } else {
        if (argv.backup) {
            fse.copySync(argv.res, argv.backup + path.sep + path.basename(path.resolve(argv.res)) + new Date().getTime())
        }

        let files = res.filter(element => fs.lstatSync(path.resolve(__dirname, element)).isFile() && extensions.includes(path.extname(element)))
        spinner.succeed()

        spinner = ora('Encoding files').start();
        files.forEach(file => {
            const key = crypto.createHash('sha256').update(argv.password).digest("hex").toUpperCase();
            const data = fs.readFileSync(file)
            const encoded = tea.encode(data, key);
            fs.writeFileSync(file + 'c', encoded, { flag: 'w+', encoding: 'base64' })
        });
        spinner.succeed()

        if (argv.meta) {
            spinner = ora('Editing meta.xml').start();
            const meta = res.filter(element => fs.lstatSync(path.resolve(__dirname, element)).isFile() && element.includes('meta.xml'))[0]
            let data = fs.readFileSync(meta).toString('utf8')
            extensions.forEach(extension => {
                data = data.replace(extension, extension + 'c')
            });

            fs.writeFileSync(meta, data, { flag: 'w+' })
            spinner.succeed()
        }
    }
})