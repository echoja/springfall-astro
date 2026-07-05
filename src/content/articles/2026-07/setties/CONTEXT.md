# Setties Article

This context captures the vocabulary for the Setties article. It exists to keep the article's framing precise, not to document the whole Springfall Astro codebase.

## Language

**Setties**:
The public name of the author's personal macOS environment management project. It is a verification-oriented settings repository for keeping a development machine in the intended state.
_Avoid_: Settings, dotfiles framework

**참고 독자**:
The intended reader for the Setties article: someone curious about how another person manages dotfiles and machine setup, mainly looking for well-done ideas to borrow rather than a reason to replace their own system.
_Avoid_: 도입 독자, 튜토리얼 독자

**선언형 의존성 목록**:
A JSON-based inventory of tools, apps, and files that should exist on the machine, written as the desired state rather than as an installation procedure.
_Avoid_: 설치 스크립트, 셋업 절차

**상태 검증 명령**:
A command that checks whether the current machine matches Setties' declared expectations. `./v` is only a shortcut to this command, not the central product idea.
_Avoid_: ./v 중심, 테스트 스위트

**AI Agent 기준점**:
The explicit, repeatable verification surface that an AI agent can use as the primary correctness reference after setup-related changes. Humans can also inspect it, but they are not the main consumer in this framing.
_Avoid_: 사람 중심 검증, AI 자동화

**에러에 덜 취약한 구성**:
The article's opening motivation: Setties was shaped by asking how dotfiles management can be less fragile than manual docs or imperative shell scripts when steps are omitted, environments differ, or commands fail. The main mechanism is making desired state explicit enough that drift can be detected.
_Avoid_: AI용 dotfiles, 자동화 만능주의, 실수 방지, 자동 복구

**패턴 공유 글**:
The chosen article frame: Setties is used as a concrete example to share transferable dotfiles-management patterns, rather than being introduced as a product or framework to adopt wholesale.
_Avoid_: 제품 소개글, 도입 가이드

**경험 공유 톤**:
The article voice should explain how the author manages their own dotfiles, without implying that readers should adopt the same system.
_Avoid_: 베스트 프랙티스 톤, 처방형 톤

**AI-readable 기준**:
A structured setup reference that an AI agent can parse, modify, and verify without depending on long prose. This is not a separate philosophy from human readability; it is a practical benefit of keeping setup expectations explicit.
_Avoid_: README 기준, 암묵적 기준

**검출 가능성**:
The core property Setties wants from declarative setup management: when the current machine or repository data differs from the intended state, the difference should be visible through verification.
_Avoid_: 자동 복구, 완전 자동화

**AI 작업 가드레일**:
Schema validation and pre-commit checks that prevent AI-assisted edits from breaking established repository formats or committing inconsistent setup data.
_Avoid_: 도구 철학, 런타임 검증

**명령형/선언형 비교**:
A short framing contrast for the article: Setties favors recording intended state over writing a long manual or one-shot shell procedure, but the article should not become a theoretical discussion of declarative configuration.
_Avoid_: 선언형 이론 섹션, IaC 일반론

**링크 관리**:
The dotfiles pattern where files are version-controlled inside Setties while appearing at their expected locations in the home directory through symlinks.
_Avoid_: safe mode 중심, 덮어쓰기 정책 중심

**수동 작업 경계**:
The practical limit of Setties automation: tasks that require `sudo`, App Store interaction, GUI confirmation, or account sign-in are left as manual README steps for now because the implementation tricks seem more complex than the benefit, and the number of manual commands is small.
_Avoid_: 원칙적 자동화 금지, 모든 작업 자동화
