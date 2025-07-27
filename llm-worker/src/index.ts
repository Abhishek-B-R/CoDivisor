import { subscriber } from "./redis";

async function  main() {
    while(1){
        console.log("Hey this function started working")
        const response=await subscriber.brPop(
            'llm-queue',
            0
        );
    }
}
main()