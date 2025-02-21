---
title: 使用类包装枚举
date: "2022-11-12 10:39:00"
tags: [C++]
category: blog
---
C++ 中的枚举类提供了一种定义常量的方式，但直接使用枚举往往存在表达能力不足的问题，导致用户使用繁琐，因此使用类对枚举进行包装是常见的方式，使得枚举可以拥有自定义的继承关系和转换规则，这种手法也在 `std::<partical | strong | weak>_ordering` 中得到运用。

<!-- more -->

```cpp

#include <cassert>

class State {
    enum class State_impl :unsigned char {
        Ready, Active, Suspended, Successed, Failed
    };
    State_impl state = State_impl::Ready;
    State() = delete;
    constexpr State(State_impl state) { this->state = state; }
public:
    constexpr explicit operator int() const {
        return static_cast<int>(state);
    }
    constexpr State& operator=(int state) {
        bool check = false;
        State_impl state_impl = static_cast<State_impl>(state);
        switch (state_impl) {
        case State_impl::Ready:
        case State_impl::Active:
        case State_impl::Suspended:
        case State_impl::Successed:
        case State_impl::Failed:
            check = true;
        }
        assert(check);
        this->state = static_cast<State_impl>(state);
        return *this;
    }
    const static State Ready;
    const static State Active;
    const static State Suspended;
    const static State Successed;
    const static State Failed;
};

inline constexpr State State::Ready{ State_impl::Ready };
inline constexpr State State::Active{ State_impl::Active };
inline constexpr State State::Suspended{ State_impl::Suspended };
inline constexpr State State::Successed{ State_impl::Successed };
inline constexpr State State::Failed{ State_impl::Failed };

int main() {
    int a{ State::Suspended };
    a = static_cast<int>(State::Suspended);
    State state = State::Ready;
    state = a;
}

```
