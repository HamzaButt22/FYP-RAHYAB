// The bundled copy of streams.json (offline, FR-65), typed for the library.
import streams from './streams.json';
import type { StreamsData } from './library';

export const STREAMS = streams as unknown as StreamsData;
