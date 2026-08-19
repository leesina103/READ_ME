# Git 커밋 규칙

## 기본 절차

1. 변경 내용을 확인한다.
2. 사용할 커밋 메시지를 사용자에게 먼저 보여준다.
3. 사용자의 확인을 받은 뒤에만 커밋한다.
4. 커밋 후 커밋 해시와 작업 트리 상태를 확인한다.

## 커밋 메시지 형식

커밋 메시지는 변경 유형을 나타내는 영문 단어로 시작한다.

```text
<Type> <변경 내용>
```

### 사용 유형

- `Add`: 파일, 기능, 문서 등 새로운 내용을 추가할 때
- `Delete`: 파일, 기능, 문서 등 기존 내용을 삭제할 때

### 예시

```text
Add READ ME v1.0 project
Add project structure analysis
Add Git commit conventions
Delete unused example assets
```

## 작성 원칙

- 첫 단어는 `Add` 또는 `Delete`로 작성한다.
- 무엇이 변경되었는지 짧고 명확하게 작성한다.
- 커밋 하나에는 서로 관련된 변경만 포함한다.
- 사용자가 확인하지 않은 메시지로 커밋하지 않는다.
