import type Pulsar from "pulsar-client";

interface CoreAggregateApcData {
  feedPublisherId: string;
  tripId: string;
  startDate: string;
  startTime: string;
  routeId: string;
  directionId: number;
  countingVendorName: string;
  timezoneName: string;
}

export type CountClass =
  | "adult"
  | "child"
  | "pram"
  | "bike"
  | "wheelchair"
  | "other";

export interface DoorClassCount {
  doorNumber: number;
  countClass: CountClass;
  in: number;
  out: number;
}

interface StopAndDoorsAggregateApcData {
  stopId: string;
  stopSequence: number;
  doorClassCounts: DoorClassCount[];
}

type AggregateApcData = CoreAggregateApcData & StopAndDoorsAggregateApcData;

// A morning trip.
const coreTestData: CoreAggregateApcData = {
  feedPublisherId: "fi:kuopio",
  tripId: "Talvikausi_Ma-Pe_3_0_074500_075400_0",
  startDate: "2022-03-10",
  startTime: "07:45:00",
  routeId: "3",
  directionId: 0,
  countingVendorName: "Fake Vendor",
  timezoneName: "Europe/Helsinki",
};

const stopsAndDoorsTestData: StopAndDoorsAggregateApcData[] = [
  // Several adults and children embark. One adult has a pram.
  {
    stopId: "201827",
    stopSequence: 1,
    doorClassCounts: [
      {
        doorNumber: 1,
        countClass: "adult",
        in: 7,
        out: 0,
      },
      {
        doorNumber: 1,
        countClass: "child",
        in: 8,
        out: 0,
      },
      {
        doorNumber: 2,
        countClass: "adult",
        in: 1,
        out: 0,
      },
      {
        doorNumber: 2,
        countClass: "pram",
        in: 1,
        out: 0,
      },
    ],
  },
  // Some adults embark and disembark.
  {
    stopId: "201839",
    stopSequence: 2,
    doorClassCounts: [
      {
        doorNumber: 1,
        countClass: "adult",
        in: 3,
        out: 0,
      },
      {
        doorNumber: 2,
        countClass: "adult",
        in: 0,
        out: 1,
      },
    ],
  },
  // More passengers embark. The parent with the pram disembarks.
  {
    stopId: "201855",
    stopSequence: 3,
    doorClassCounts: [
      {
        doorNumber: 1,
        countClass: "adult",
        in: 1,
        out: 0,
      },
      {
        doorNumber: 1,
        countClass: "child",
        in: 2,
        out: 0,
      },
      {
        doorNumber: 2,
        countClass: "adult",
        in: 0,
        out: 1,
      },
      {
        doorNumber: 2,
        countClass: "pram",
        in: 0,
        out: 1,
      },
      {
        doorNumber: 3,
        countClass: "adult",
        in: 0,
        out: 1,
      },
    ],
  },
  // The children disembark on the same stop to go to school. One of the
  // children uses the front door to get out.
  {
    stopId: "201504",
    stopSequence: 4,
    doorClassCounts: [
      {
        doorNumber: 1,
        countClass: "child",
        in: 0,
        out: 1,
      },
      {
        doorNumber: 2,
        countClass: "adult",
        in: 0,
        out: 1,
      },
      {
        doorNumber: 2,
        countClass: "child",
        in: 0,
        out: 3,
      },
      {
        doorNumber: 3,
        countClass: "child",
        in: 0,
        out: 6,
      },
    ],
  },
  // Many of the adults disembark on the same stop.
  {
    stopId: "201625",
    stopSequence: 5,
    doorClassCounts: [
      {
        doorNumber: 1,
        countClass: "adult",
        in: 1,
        out: 0,
      },
      {
        doorNumber: 2,
        countClass: "adult",
        in: 0,
        out: 5,
      },
      {
        doorNumber: 3,
        countClass: "adult",
        in: 0,
        out: 1,
      },
    ],
  },
  // No one embarks or disembarks on this stop.
  {
    stopId: "201285",
    stopSequence: 6,
    doorClassCounts: [],
  },
  // Some adults disembark.
  {
    stopId: "315008",
    stopSequence: 7,
    doorClassCounts: [
      {
        doorNumber: 2,
        countClass: "adult",
        in: 0,
        out: 1,
      },
      {
        doorNumber: 3,
        countClass: "adult",
        in: 0,
        out: 1,
      },
    ],
  },
  // The bus becomes empty on the final stop.
  {
    stopId: "315110",
    stopSequence: 8,
    doorClassCounts: [
      {
        doorNumber: 3,
        countClass: "adult",
        in: 0,
        out: 1,
      },
    ],
  },
];

export const generateTestData = (): AggregateApcData[] =>
  stopsAndDoorsTestData.map((stopAndDoors) => ({
    ...coreTestData,
    ...stopAndDoors,
  }));

const generateMessages = (): Pulsar.ProducerMessage[] =>
  generateTestData().map((oneStopTestData) => ({
    data: Buffer.from(JSON.stringify(oneStopTestData), "utf8"),
    eventTimestamp: Date.now(),
  }));

export const generateAndSendAggregationTestData = async (
  pulsarProducer: Pulsar.Producer
) => {
  // foreach and async functions do not mix.
  // eslint-disable-next-line no-restricted-syntax
  for (const message of generateMessages()) {
    // We have a try-catch outside of this function.
    // Use await to make sure all messages get sent.
    // eslint-disable-next-line no-await-in-loop
    await pulsarProducer.send(message);
  }
  // We have a try-catch outside of this function.
  // eslint-disable-next-line @typescript-eslint/return-await
  return await pulsarProducer.flush();
};
