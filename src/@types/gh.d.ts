/* eslint-disable @typescript-eslint/no-explicit-any, prettier/prettier */

//https://github.com/actions/toolkit/issues/199#issuecomment-556342305
declare module '@octokit/graphql' {
    export type Variables = any
    export type GraphQlQueryResponse = any
}

/* eslint-enable @typescript-eslint/no-explicit-any, prettier/prettier */
