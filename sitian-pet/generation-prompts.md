# 小司天生成记录

全部美术使用内置imagegen生成；代码只负责切格、去除相邻格残片、缩放、透明处理、打包和验证。

母版：依据用户司天角色图，生成约2.5头身完整Q版星官。黑色长发高髻、青玉冠、金横簪、青白金层叠汉服，手持小浑天仪。柔和精致动漫笔触，透明背景，无环境文字。

动作图集：保持母版脸型、服装、冠饰和浑天仪，制作待机眨眼、右行、左行、挥手、跳跃、疲倦低落、等待、工作思考、查看结果九组独立连续姿态。8列11行，预留16注视槽位；无网格、无标题，透明背景。

最终注视重绘提示：

Edit target: a 4 by 4 sprite grid of sixteen gazing poses. Identity reference: approved idle sprite. Match its larger round head, tiny short body, fluffy black hair silhouette, simple pale jade crown, ivory/celadon/gold hanfu, rounded short sleeves and small armillary sphere. Every cell same scale and front-facing torso; only head tilt and open-eye pupils follow gaze. Clockwise directions from screen up in22.5 degree steps, row-major. Equal cells, transparent gutters, complete crown. No blink, no elongated body, no background/shadow/sparkles/text.

最终行走重绘提示：

Create a clean replacement walking sprite sheet. Reference: exact approved chibi idle sprite; large rounded head, tiny body, soft anime brushwork, black long hair, jade crown/gold hairpin, ivory celadon gold hanfu and tiny armillary sphere. Exactly4columns4rows. First two rows eight sequential walking RIGHT frames; last two rows eight walking LEFT frames. Feet alternate naturally, robes/hair bounce; same scale and ground baseline. Full silhouette inside EVERY cell with at least12% empty transparent margin on all sides, especially trailing hair. Shorten hair silhouette to fit rather than crop. Complete crown and feet. Actual transparency; no shadows, glow, sparkles, grid lines or text.
