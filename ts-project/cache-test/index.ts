import CacheController from "../cache-controller";
import { RECache } from "../types-lib";

const cache = new CacheController();

const cacheCopyThing: RECache = cache.ReturnCache();

console.log(cacheCopyThing.Programs.length);

