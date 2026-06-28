FROM node:20-alpine

# Встановлюємо openssl, який необхідний для роботи Prisma Client на Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Копіюємо файли залежностей та встановлюємо їх
COPY package*.json ./
RUN npm install

# Копіюємо весь інший код проєкту
COPY . .

# Генеруємо Prisma Client відповідно до схеми
RUN npx prisma generate

# Збираємо Next.js додаток
RUN npm run build

# Відкриваємо порт 3000
EXPOSE 3000

# Запускаємо міграції бази даних перед стартом веб-додатка
CMD npx prisma migrate deploy && npm run start
