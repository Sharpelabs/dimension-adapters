import { getAllAdapters } from "./cli/runAdapter";

console.log(Date());
  async function measureAsyncFunction() {
    console.time('Async Execution Time');

    // await getAllAdapters("aggregator-derivatives");
    await getAllAdapters("aggregators");
    await getAllAdapters("bridge-aggregator");
    await getAllAdapters("options");
    await getAllAdapters("protocols");
    await getAllAdapters("dexs");
    
    console.timeEnd('Async Execution Time');
  }
  
  console.time('Execution Time');
  (async () => {
    await measureAsyncFunction();
})()
