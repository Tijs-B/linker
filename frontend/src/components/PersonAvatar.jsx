import {itemColor} from "../theme/colors.js";
import {Avatar} from "@mui/material";

export default function PersonAvatar({item, sx}) {
    if (!item) {
        return null;
    }
    const code = item.code || item.number.toString().padStart(2, '0');
    const bgcolor = itemColor(item);
    const baseFontSize = sx && 'width' in sx ? sx.width * 0.6 : 20;
    const fontSize = code.length > 2 ? baseFontSize * 0.8 : baseFontSize;
    return (
        <Avatar sx={{bgcolor, fontSize, ...sx}}>
            {code}
        </Avatar>
    )
}