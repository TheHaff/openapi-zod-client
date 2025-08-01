# openapi-zod-client

[![Screenshot 2022-11-12 at 18 52 25](https://user-images.githubusercontent.com/47224540/201487856-ffc4c862-6f31-4de1-8ef1-3981fabf3416.png)](https://openapi-zod-client.vercel.app/)

Generates Zod schemas from a (json/yaml) [OpenAPI spec](https://github.com/OAI/OpenAPI-Specification)

-   can be used programmatically _(do w/e you want with the computed schemas/endpoints)_
-   or used as a CLI _(generates a prettier .ts file with deduplicated variables when pointing to the same schema/$ref)_

-   client typesafety using [Zod](https://github.com/colinhacks/zod)
-   tested (using [vitest](https://vitest.dev/)) against official [OpenAPI specs samples](https://github.com/OAI/OpenAPI-Specification/tree/main/schemas)

# Why this exists

sometimes you don't have control on your API, maybe you need to consume APIs from other teams (who might each use a different language/framework), you only have their Open API spec as source of truth, then this might help 😇

you could use `openapi-zod-client` to automate the schema generation part on your CI and just import the generated schemas

## Comparison vs tRPC etc

please just use [tRPC](https://github.com/trpc/trpc) or alternatives ([ts-rest](https://ts-rest.com/) looks cool as well) if you do have control on your API/back-end

# Usage

with local install:

-   `pnpm i -D openapi-zod-client`
-   `pnpm openapi-zod-client "./input/file.json" -o "./output/client.ts"`

or directly (no install)

-   `pnpx openapi-zod-client "./input/file.yaml" -o "./output/client.ts"`

# auto-generated doc

https://paka.dev/npm/openapi-zod-client

## CLI

```sh
openapi-zod-client/1.4.2

Usage:
  $ openapi-zod-client <input>

Commands:
  <input>  path/url to OpenAPI/Swagger document as json/yaml

For more info, run any command with the `--help` flag:
  $ openapi-zod-client --help

Options:
  -o, --output <path>       Output path for the zod schemas ts file (defaults to `<input>.schemas.ts`)
  -t, --template <path>     Template path for the handlebars template that will be used to generate the output
  -p, --prettier <path>     Prettier config path that will be used to format the output client file
  -b, --base-url <url>      Base url for the api
  -a, --with-alias          With alias as api client methods
  --error-expr <expr>       Pass an expression to determine if a response status is an error
  --success-expr <expr>     Pass an expression to determine which response status is the main success status
  --media-type-expr <expr>  Pass an expression to determine which response content should be allowed
  --export-schemas          When true, will export all `#/components/schemas`
  --implicit-required       When true, will make all properties of an object required by default (rather than the current opposite), unless an explicitly `required` array is set
  --with-deprecated         when true, will keep deprecated endpoints in the api output
  --group-strategy          groups endpoints by a given strategy, possible values are: 'none' | 'tag' | 'method' | 'tag-file' | 'method-file'
  --complexity-threshold    schema complexity threshold to determine which one (using less than `<` operator) should be assigned to a variable
  --default-status          when defined as `auto-correct`, will automatically use `default` as fallback for `response` when no status code was declared
  -v, --version             Display version number
  -h, --help                Display this message
```

## Customization

You can pass a custom [handlebars](https://handlebarsjs.com/) template and/or a [custom prettier config](https://prettier.io/docs/en/configuration.html) with something like:

`pnpm openapi-zod-client ./example/petstore.yaml -o ./example/petstore-schemas.ts -t ./example/schemas-only.hbs -p ./example/prettier-custom.json --export-schemas`, there is an example of the output [here](./examples/schemas-only/petstore-schemas.ts)

## When using the CLI

-   `--success-expr` is bound to [`isMainResponseStatus`](https://github.com/astahmer/openapi-zod-client/blob/b7717b53023728d077ceb2f451e4787f32945b3d/src/generateZodClientFromOpenAPI.ts#L234-L244)
-   `--error-expr` is bound to [`isErrorStatus`](https://github.com/astahmer/openapi-zod-client/blob/b7717b53023728d077ceb2f451e4787f32945b3d/src/generateZodClientFromOpenAPI.ts#L245-L256)

You can pass an expression that will be safely evaluted (thanks to [whence](https://github.com/jonschlinkert/whence/)) and works like `validateStatus` from axios to determine which OpenAPI `ResponseItem` should be picked as the main one for the `ZodiosEndpoint["response"]` and which ones will be added to the `ZodiosEndpoint["errors"]` array.

Exemple: `--success-expr "status >= 200 && status < 300"`

## Tips

-   You can omit the `-o` (output path) argument if you want and it will default to the input path with a `.ts` extension: `pnpm openapi-zod-client ./input.yaml` will generate a `./input.yaml.ts` file
-   Since internally we're using [swagger-parser](https://github.com/APIDevTools/swagger-parser), you should be able to use an URL as input like this:
    `pnpx openapi-zod-client https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml -o ./petstore.ts`

-   Also, multiple-files-documents ($ref pointing to another file) should work out-of-the-box as well, but if it doesn't, maybe [dereferencing](https://apitools.dev/swagger-parser/docs/swagger-parser.html#dereferenceapi-options-callback) your document before passing it to `openapi-zod-client` could help

## Example

-   You can check an example [input](./examples/petstore.yaml) (the petstore example when you open/reset [editor.swagger.io](https://editor.swagger.io/)) and [output](./examples/basic/petstore-client.ts)
-   there's also [an example of a programmatic usage](./examples/basic/petstore-generator.ts)
-   or you can check the tests in the `src` folder which are mostly just inline snapshots of the outputs

# tl;dr

[input](./samples/v3.0/petstore.yaml):

```yaml
openapi: "3.0.0"
info:
    version: 1.0.0
    title: Swagger Petstore
    license:
        name: MIT
servers:
    - url: http://petstore.swagger.io/v1
paths:
    /pets:
        get:
            summary: List all pets
            operationId: listPets
            tags:
                - pets
            parameters:
                - name: limit
                  in: query
                  description: How many items to return at one time (max 100)
                  required: false
                  schema:
                      type: integer
                      format: int32
            responses:
                "200":
                    description: A paged array of pets
                    headers:
                        x-next:
                            description: A link to the next page of responses
                            schema:
                                type: string
                    content:
                        application/json:
                            schema:
                                $ref: "#/components/schemas/Pets"
                default:
                    description: unexpected error
                    content:
                        application/json:
                            schema:
                                $ref: "#/components/schemas/Error"
        post:
            summary: Create a pet
            operationId: createPets
            tags:
                - pets
            responses:
                "201":
                    description: Null response
                default:
                    description: unexpected error
                    content:
                        application/json:
                            schema:
                                $ref: "#/components/schemas/Error"
    /pets/{petId}:
        get:
            summary: Info for a specific pet
            operationId: showPetById
            tags:
                - pets
            parameters:
                - name: petId
                  in: path
                  required: true
                  description: The id of the pet to retrieve
                  schema:
                      type: string
            responses:
                "200":
                    description: Expected response to a valid request
                    content:
                        application/json:
                            schema:
                                $ref: "#/components/schemas/Pet"
                default:
                    description: unexpected error
                    content:
                        application/json:
                            schema:
                                $ref: "#/components/schemas/Error"
components:
    schemas:
        Pet:
            type: object
            required:
                - id
                - name
            properties:
                id:
                    type: integer
                    format: int64
                name:
                    type: string
                tag:
                    type: string
        Pets:
            type: array
            items:
                $ref: "#/components/schemas/Pet"
        Error:
            type: object
            required:
                - code
                - message
            properties:
                code:
                    type: integer
                    format: int32
                message:
                    type: string
```

output:

```ts
import { z } from "zod";
import { z } from "zod";

const Pet = z.object({ id: z.number().int(), name: z.string(), tag: z.string().optional() });
const Pets = z.array(Pet);
const Error = z.object({ code: z.number().int(), message: z.string() });

export const schemas = {
    Pet,
    Pets,
    Error,
};

const endpoints = makeApi([
    {
        method: "get",
        path: "/pets",
        requestFormat: "json",
        parameters: [
            {
                name: "limit",
                type: "Query",
                schema: z.number().int().optional(),
            },
        ],
        response: z.array(Pet),
    },
    {
        method: "post",
        path: "/pets",
        requestFormat: "json",
        response: z.void(),
    },
    {
        method: "get",
        path: "/pets/:petId",
        requestFormat: "json",
        parameters: [
            {
                name: "petId",
                type: "Path",
                schema: z.string(),
            },
        ],
        response: Pet,
    },
]);

export const schemas = {
    // Your generated schemas here
};
```

# TODO

-   handle OA `prefixItems` -> output `z.tuple`
-   rm unused (=never referenced) variables from output

# Caveats

NOT tested/expected to work with OpenAPI before v3, please migrate your specs to v3+ if you want to use this

## Contributing:

-   `pnpm i && pnpm gen`

if you fix an edge case please make a dedicated minimal reproduction test in the [`tests`](./tests) folder so that it doesn't break in future versions
