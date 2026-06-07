def _searialize_state(state: dict) -> dict:
    serialized = dict(state)
    serialized["messages"] = [
        {"role": "ai" if hasattr(m, "type") and m.type == "ai" else "human", "content": m.content}
        for m in state.get("messages", [])
    ]
    return serialized

def _deserialize_state(state: dict) -> dict:
    from langchain_core.messages import AIMessage, HumanMessage

    deserialized = dict(state)
    messages = []
    for m in state.get("messages", []):
        if m["role"] == "ai":
            messages.append(AIMessage(content=m["content"]))
        else:
            messages.append(HumanMessage(content=m["content"]))

    deserialized["messages"] = messages
    return deserialized
