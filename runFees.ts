import { getAllAdapters } from "./cli/runAdapter";

console.log(Date());
  async function measureAsyncFunction() {
    console.time('Async Execution Time');
    await getAllAdapters("fees");
    console.timeEnd('Async Execution Time');
  }
  
  console.time('Execution Time');
  (async () => {
    await measureAsyncFunction();
})()
