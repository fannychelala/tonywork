FROM node:24-bookworm-slim
WORKDIR /poc
RUN npm install -g pnpm@11.25.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY experiments/telephony-poc ./experiments/telephony-poc
USER node
CMD ["pnpm", "exec", "tsx", "experiments/telephony-poc/main.ts"]
