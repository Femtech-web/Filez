import { GraphQLClient } from "graphql-request";

export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ??
  " https://api.studio.thegraph.com/query/1716466/filez/v0.0.1";

export const subgraphClient = new GraphQLClient(SUBGRAPH_URL);


