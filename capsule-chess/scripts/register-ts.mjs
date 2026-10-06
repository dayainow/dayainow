// Node에서 src/의 TypeScript 파일을 바로 실행할 수 있게, 확장자 없는 상대 경로 import에 .ts를 붙여 준다.
// 사용: node --import ./scripts/register-ts.mjs scripts/어떤스크립트.ts
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
