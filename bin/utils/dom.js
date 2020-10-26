class DOM {
    static CreateElement(type, attributes = {}, ...children) {
        const elem = document.createElement(type);
        for (const attr of Object.keys(attributes)) {
            if (attributes[attr] instanceof Function)
                elem.addEventListener(attr.substr(2).toLocaleLowerCase(), attributes[attr]);
            else
                elem.setAttribute(attr, attributes[attr]);
        }
        for (const child of children)
            if (child instanceof Node)
                elem.appendChild(child);
            else if (child instanceof String || typeof child == "string" || child instanceof Number || typeof child == "number")
                elem.appendChild(document.createTextNode(child.toString()));
        return elem;
    }
}
