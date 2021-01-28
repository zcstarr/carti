import program from "commander";
import { makeLogger } from "../../lib/logging"
import { Bundle } from "@createdreamtech/carti-core"
import { Config } from "../../lib/config"
import { CID } from "multiformats";
import chalk from "chalk";
import { handleInstall } from "./install"
import { commandHandler } from "./command_util";


export const addGetCommand = (config: Config): program.Command => {
    const machineCommand = program.command("get <name>")
        .description("get installs bundle if not local and returns bundle location information")
        .usage("get <name>")
        .option("-y, --yes", "choose first match")
        .option("-p, --path", "only return path information")
        .option("-g, --global", "install bundle into global location")
        .action(async (name, options) => {
            return commandHandler(handleGet,config, name, options.yes, options.path, options.global)
        })
    return machineCommand
}


const renderBundle = (b: Bundle, path:string): string => {
    const { name, version, id } = b;
    return `${name}:${id}:${version}:${chalk.green(path)}`
}

const dedup = (buns: Bundle[]) => {
    const lookup: any = {}
    const acc: Bundle[] = []
    buns.forEach((b) => {
        if (!lookup[b.id]) {
            acc.push(b)
            lookup[b.id] = true
        }
    })
    return acc;
}
// handleGet the logic here will cause the commandline to search the global space if global is specified, 
// otherwise the logic will simply try and resolve the bundle anyway it can (global or local space) and install the data locally 
// if it's not found in either. This differs from --global , which will try and install any missing bundle to the global space
async function handleGet(config: Config, name:string, yes:boolean, pathOnly: boolean, global?: boolean): Promise<void> {
    const localBundles = await config.localConfigStorage.get(name)
    const globalBundles = await config.globalLocalConfigStorage.get(name)
    let bundles = global ? globalBundles : localBundles.concat(globalBundles)
    bundles = dedup(bundles)
   
    let bun = bundles[0]
    const render = async (b:Bundle) =>{
        const bundleId = CID.parse(b.id)
        const lExists = await config.bundleStorage.local.diskProvider.exists(bundleId)
        const bPath = await config.bundleStorage.path(bundleId)
        const path = global ? bPath.global! : lExists ? bPath.local! : bPath.global! 
        if(pathOnly){
            console.log(path)
            return
        }
        console.log(renderBundle(b,path!))
    }
    if(bundles.length === 0){
        bun = await handleInstall(config, name, yes, global)
        render(bun)
        return
    }
    if(yes)
        return render(bun)

    for (const bun of bundles){
        await render(bun)
    }
}
