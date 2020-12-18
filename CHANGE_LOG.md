## v3.1.0 2020-12-18

[update] 增加`agent-reducer@1.*`支持，
增加`useAgentReducer`方法只支持`agent-reducer@3.*`版本特性，
通过使用`agent-reducer`的配置方法`globalConfig`将全局环境设置为`agent-reducer@1.*`支持环境，
这时`useAgent`只支持`agent-reducer@1.*`特性，
而`useAgentReducer`方法因不受全局影响，依然只支持`agent-reducer@3.*`。

[update] 重新增加被去除的`use-agent-reducer@1.*`方法：useBranch,useParent作为废弃方法。