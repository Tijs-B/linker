import {IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Snackbar} from "@mui/material";
import CallIcon from '@mui/icons-material/Call';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {memo, useCallback, useState} from "react";

export default memo(function ({team}) {
    const [copied, setCopied] = useState(false);

    const copyPhoneNumber = useCallback((phoneNumber) => {
        navigator.clipboard.writeText(phoneNumber);
        setCopied(true);
    }, [setCopied]);

    const items = team.contact_persons.map((person) => (
        <ListItem
            key={person.id}
            disablePadding
            secondaryAction={<>
                {person.is_favorite ?
                    <IconButton>
                        <StarIcon/>
                    </IconButton>
                    :
                    <IconButton>
                        <StarBorderIcon/>
                    </IconButton>
                }
                <IconButton
                    edge="end"
                    disabled={!person.phone_number}
                    onClick={() => copyPhoneNumber(person.phone_number)}
                >
                    <ContentCopyIcon/>
                </IconButton>
            </>}
        >
            <ListItemButton
                component="a"
                href={`tel:${person.phone_number}`}
                disabled={!person.phone_number}
            >
                <ListItemIcon>
                    <CallIcon/>
                </ListItemIcon>
                <ListItemText
                    primary={person.name}
                    secondary={person.phone_number ? person.phone_number : '-'}
                />
            </ListItemButton>
        </ListItem>

    ))

    return (
        <>
            <List dense>
                {items}
            </List>
            <Snackbar
                open={copied}
                onClose={() => setCopied(false)}
                autoHideDuration={2000}
                message="Gekopiëerd!"
            />
        </>
    )
});