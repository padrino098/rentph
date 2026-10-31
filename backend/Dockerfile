FROM golang:1.27-alpine AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/rentph-api .

FROM alpine:3.23

RUN apk add --no-cache ca-certificates
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build /out/rentph-api /usr/local/bin/rentph-api
USER app
EXPOSE 8000
ENTRYPOINT ["rentph-api"]