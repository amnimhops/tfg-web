import { router } from "@/router";
import { useStore } from "@/store";

const store = useStore();

export function fatalError(err:any){
    console.error(err);
    store.commit('setError',err);
    router.push({path:'/error'})
}