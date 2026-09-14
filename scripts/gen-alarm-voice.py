import asyncio
from pathlib import Path

import edge_tts

OUT = Path(__file__).resolve().parents[1] / "public" / "audio" / "voice"
VOICE = "zh-CN-XiaoxiaoNeural"

CLIPS = {
    "intro.mp3": "火警报警演练开始，请拨打正确的火警电话。",
    "connected.mp3": "火警电话已接通。您好，消防救援指挥中心，请问发生了什么情况？",
    "wrong_number.mp3": "号码不正确，请拨打正确的火警电话。",
    "ask_where.mp3": "收到，发生火灾。请问发生在哪里？小区、商场，还是工厂？",
    "not_fire.mp3": "这里是火警专线，请报告火灾相关情况。",
    "where_community.mp3": "地点已记录，发生在小区。请问是否有人被困？",
    "where_mall.mp3": "地点已记录，发生在商场。请问是否有人被困？",
    "where_factory.mp3": "地点已记录，发生在工厂。请问是否有人被困？",
    "people_yes.mp3": "人员情况已记录，有人被困。请确认报警信息。",
    "people_no.mp3": "人员情况已记录，无人被困。请确认报警信息。",
    "people_unknown.mp3": "人员情况已记录，人员情况暂不清楚。请确认报警信息。",
    "incomplete.mp3": "请完整填写火灾地点和人员情况后再提交。",
    "received.mp3": "信息已接收。",
    "dispatch_community_yes.mp3": "小区发生火灾，有人员被困。",
    "dispatch_community_no.mp3": "小区发生火灾，暂无人被困。",
    "dispatch_community_unknown.mp3": "小区发生火灾，人员情况不清楚。",
    "dispatch_mall_yes.mp3": "商场发生火灾，有人员被困。",
    "dispatch_mall_no.mp3": "商场发生火灾，暂无人被困。",
    "dispatch_mall_unknown.mp3": "商场发生火灾，人员情况不清楚。",
    "dispatch_factory_yes.mp3": "工厂发生火灾，有人员被困。",
    "dispatch_factory_no.mp3": "工厂发生火灾，暂无人被困。",
    "dispatch_factory_unknown.mp3": "工厂发生火灾，人员情况不清楚。",
    "enroute.mp3": "消防车正在赶赴现场，请保持电话畅通，注意自身安全。",
    "success.mp3": "报警成功。报警时应尽量说清楚发生地点、火灾情况和人员情况。",
}


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, text in CLIPS.items():
        path = OUT / name
        print(f"generating {name} ...")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(str(path))
        print(f"  saved {path.stat().st_size} bytes")
    print("done", len(CLIPS))


if __name__ == "__main__":
    asyncio.run(main())
