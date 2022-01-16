# mta-model-encoder
This utility is made to protect MTA:SA.asset files(`.txd`, `.dff`) for the MTA:SA.

This script encodes files with tea-encode compatible with MTA:SA. Then replaces default `engineLoad*` functions with custom one and includes `client.lua` file into encoder script and executes it after resource start. So all model replacements should be in `client.lua` file.

# Usage

First, install all packets.
```
npm install
```

Run script without any arguments and it will list all options and usage example.
```
node index.js
```

The only two **required** arguments are `--res [folder]` or `-r` in short form. This is the path to the resource. And `--password` or `-p` for ecryption password.

With `--backup [folder]` or `-b` you can specify where your resources will be saved before any operations. They will be saved as original folder name + current timestamp.

With `--del` or `-d` you can turn on deletion of original `.lua` files, works only when backup option is set. This is especially useful for any kind of CI/CD pipeline.

**NOTE:** With `--full` or `-f` the script will include `client.lua` file into encoder. This is preffered way of usage.

With `--meta` or `-m` the script will replace file extensions in meta file.

# Example

This will fully ecrypt resource in `resourceFolder`, save the original to the `backup/` and delete original asset files.
```
node index.js -r resourceFolder -b backup -p password -d -f -m
```
