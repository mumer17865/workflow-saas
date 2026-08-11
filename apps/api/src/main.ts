import { ValidationPipe, Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  // Behind a TLS-terminating proxy (Railway/Vercel), trust the first hop so
  // req.ip reflects the real client (per-IP rate limiting) and req.secure
  // works for secure cookies. Not enabled in dev — nothing to trust there.
  if (process.env.NODE_ENV === "production") {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }
  // API-only service: security headers on, CSP off (no HTML served).
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  app.enableCors({ origin: origins, credentials: true });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  Logger.log(`API running on http://localhost:${port}/api`, "Bootstrap");
}

void bootstrap();
