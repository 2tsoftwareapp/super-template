---
layout: default
title: Architecture Wiki
---

# Super Template Architecture Wiki

Tài liệu kiến trúc chính thức của **Super Template**.

Giai đoạn đầu tập trung vào **Web Admin Frontend**: cách tổ chức folder, trách nhiệm từng layer, luồng dữ liệu và quality rules.

## Nội dung

- [Web Admin Frontend](./frontend/)

## Nguyên tắc cốt lõi

1. Route chỉ làm routing.
2. Feature sở hữu nghiệp vụ của chính nó.
3. Service xử lý nghiệp vụ.
4. Repository xử lý giao tiếp API.
5. UI chỉ render và phát sinh event.
6. Shared code chỉ được tạo khi thực sự dùng chung.
7. Mọi boundary phải rõ ràng và kiểm chứng được.

## Repository

[truongnat/super-template](https://github.com/truongnat/super-template)
