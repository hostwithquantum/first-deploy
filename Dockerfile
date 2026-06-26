FROM node:24-slim

# set node user
USER 1000:1000
WORKDIR /home/node

# install production deps (none at runtime, but keeps the build reproducible)
COPY --chown=1000:1000 package.json package-lock.json ./
RUN npm ci --omit=dev

# copy the source
COPY --chown=1000:1000 server.js index.html ./
COPY --chown=1000:1000 static ./static

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
