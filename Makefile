.PHONY: dev test test-watch lint build start clean typecheck

dev:
	npm run dev

test:
	npm test

test-watch:
	npm run test:watch

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

build:
	npm run build

start:
	npm run start

clean:
	rm -rf .next node_modules
	npm install
	npm run build
