import { log } from "./global.js";
import { Import, GetActorId, DeleteActor } from "./foundryActions.js";

export const ActorImporter = async function (actorDataToImport) {
    let actorId = GetActorId(actorDataToImport.name);
    if (actorId == false) {
        await Import(actorDataToImport);
    } else {
        await WhatToDo(actorDataToImport, actorId);
    }
}

async function WhatToDo(actorData, actorId) {
    let actorExists = `
    ${game.i18n.localize("HTML.ActorExistText")}
    <div class="form-group-dialog newName" >
        <label for="${game.i18n.localize("HTML.ChangeName")}:</label>
        <input type="text" id="newName" name="newName" value="${actorData.name}">
    </dev>
    `

    new Dialog({
        title: game.i18n.localize("HTML.ActorImporter"),
        content: actorExists,
        buttons: {
            Import: {
                label: game.i18n.localize("HTML.Rename"),
                callback: async () => {
                    let newName = document.querySelector("#newName").value;
                    log(`Import with new name: ${newName}`);
                    actorData.name = newName;
                    await Import(actorData);
                },
            },
            Override: {
                label: game.i18n.localize("HTML.Override"),
                callback: async () => {
                    log("Overriding existing Actor")
                    await DeleteActor(actorId);
                    await Import(actorData);
                },
            },
            Cancel: {
                label: "Cancel",
                callback: () => {
                    ui.notifications.info(game.i18n.localize("HTML.ActorNotImportedMsg"));
                },
            },
        },
    }).render(true);
}


