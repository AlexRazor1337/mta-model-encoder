addEvent("requestPass", true)
addEventHandler("requestPass", resourceRoot, function()
	triggerClientEvent(client, "setPass", resourceRoot, sha256(get("pass")))
end)