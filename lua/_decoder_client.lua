local pass = nil
local function loadFile(path)
    local file = fileOpen(path)
    if not file then
        return error("No such file ".. path)
    end

    local data = fileRead(file, fileGetSize(file))
    fileClose(file)
    return data
end

function include(file_name)
    local file = loadFile(file_name)

    return assert(loadstring(file))
end


function decodeLoadTXD(filename)
    return engineLoadTXD(decodeString("tea", loadFile(filename .. 'c'), {key = pass}))
end

function decodeLoadDFF(filename)
    return engineLoadDFF(decodeString("tea", loadFile(filename .. 'c'), {key = pass}))
end

function decodeLoadCOL(filename)
    return engineLoadCOL(decodeString("tea", loadFile(filename .. 'c'), {key = pass}))
end

addEvent("setPass", true)
addEventHandler("setPass", resourceRoot, function(new_pass)
    pass = new_pass
    --CLIENT CONTENT HERE
end)

triggerServerEvent("requestPass", resourceRoot)

addDebugHook("preFunction", function(_, _, _, _, _, ...) return "skip" end, {"addDebugHook"})