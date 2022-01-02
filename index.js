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
.options('backup', { // TODO create folder if not exists
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
.options('del', {
    alias: 'd',
    describe: 'Delete original files, works only with the backup flag',
    type: 'boolean'
})
.options('full', {
    alias: 'f',
    describe: 'Full build of resource, adds pass setting to the meta and additional lua files',
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
        let files = res.filter(element => fs.lstatSync(path.resolve(__dirname, element)).isFile() && extensions.includes(path.extname(element)))
        spinner.succeed()

        if (argv.backup) {
            let backupFolder = argv.backup + path.sep + path.basename(path.resolve(argv.res)) + new Date().getTime()
            spinner = ora('Making backup to \"' + backupFolder + '"').start();
            fse.copySync(argv.res, backupFolder)
            spinner.succeed()
        }

        spinner = ora('Encoding files').start();
        files.forEach(file => {
            const key = crypto.createHash('sha256').update(argv.password).digest("hex").toUpperCase();
            const data = fs.readFileSync(file)
            const encoded = tea.encode(data, key);
            fs.writeFileSync(file + 'c', encoded, { flag: 'w+', encoding: 'base64' })

            if (argv.backup && argv.del) {
                fse.removeSync(file)
            }

        });
        spinner.succeed()

        if (argv.meta) {
            spinner = ora('Editing meta.xml').start();
            const meta = res.filter(element => fs.existsSync(path.resolve(__dirname, element)) && fs.lstatSync(path.resolve(__dirname, element)).isFile() && element.includes('meta.xml'))[0]
            let metaContent = fs.readFileSync(meta).toString('utf8')
            extensions.forEach(extension => {
                metaContent = metaContent.replace(extension, extension + 'c')
            });

            if (argv.full) {
                const clientFile = res.filter(element => fs.existsSync(path.resolve(__dirname, element)) && fs.lstatSync(path.resolve(__dirname, element)).isFile() && element.includes('client.lua'))[0]
                let data = fs.readFileSync(clientFile).toString('utf8')
                const funcs = [
                    ['engineLoadTXD', 'decodeLoadTXD'],
                    ['engineLoadDFF', 'decodeLoadDFF'],
                    ['engineLoadCOL', 'decodeLoadCOL'],
                ]

                funcs.forEach(func => {
                    data = data.replace(func[0], func[1])
                });

                fse.removeSync(clientFile);

                const decoder = fs.readFileSync('lua/_decoder_client.lua').toString('utf8').replace('--CLIENT CONTENT HERE', data)
                fs.writeFileSync(path.resolve(__dirname, argv.res + path.sep + '_decoder_client.lua'), decoder, { flag: 'w+' })
                fse.copyFileSync('lua/_decoder_server.lua', path.resolve(__dirname, argv.res + path.sep + '_decoder_server.lua'))

                metaContent = metaContent.replace(/^.*client.lua.*$/mg, '<script src="_decoder_server.lua" type="server"/><script src="_decoder_client.lua" type="client"/>');
                metaContent = metaContent.replace('</meta>', '\t<settings>\n\t\t<setting name="pass" value="' + argv.password + '" />\t</settings>\n</meta>')
            }


            fs.writeFileSync(meta, metaContent, { flag: 'w+' })
            spinner.succeed()
        }
    }
})
