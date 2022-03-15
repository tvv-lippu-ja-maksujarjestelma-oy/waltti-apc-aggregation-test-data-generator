import { CountClass, generateTestData } from "./generator";

test("All passengers on the test trip disembark", () => {
  const sums: { [countClass in CountClass]: number } = {
    adult: 0,
    child: 0,
    pram: 0,
    bike: 0,
    wheelchair: 0,
    other: 0,
  };
  generateTestData().forEach((oneStopData) => {
    oneStopData.doorClassCounts.forEach((doorClassCount) => {
      sums[doorClassCount.countClass] += doorClassCount.in - doorClassCount.out;
    });
  });
  Object.values(sums).forEach((s) => {
    expect(s).toBe(0);
  });
});
