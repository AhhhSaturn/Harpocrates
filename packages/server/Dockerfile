FROM oven/bun AS build

WORKDIR /app

COPY . .

RUN bun install

RUN bun run drizzle-kit push

RUN bun run build

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/bin/harp-server harp-server

ENV NODE_ENV=production

CMD [ "./harp-server" ]

EXPOSE 3000
