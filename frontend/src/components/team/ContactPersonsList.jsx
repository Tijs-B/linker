import {IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Snackbar} from "@mui/material";
import CallIcon from '@mui/icons-material/Call';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {memo, useCallback, useState} from "react";
import {useUpdateContactPersonMutation} from "../../services/linker.js";


const ContactPersonItem = memo(function ContactPersonItem({person}) {
    const [updateContactPerson, _] = useUpdateContactPersonMutation();

    const copyPhoneNumber = useCallback(() => {
        navigator.clipboard.writeText(person.phoneNumber);
    }, [person]);

    const toggleFavorite = useCallback(() => {
        updateContactPerson({
            ...person,
            is_favorite: !person.is_favorite,
        })
    }, [updateContactPerson, person]);

    return (
        <ListItem
            key={person.id}
            disablePadding
            secondaryAction={<>
                <IconButton onClick={toggleFavorite}>
                    {person.is_favorite ?
                        <StarIcon/>
                        :
                        <StarBorderIcon/>
                    }
                </IconButton>
                <IconButton
                    edge="end"
                    disabled={!person.phone_number}
                    onClick={copyPhoneNumber}
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
    )
})

const ContactPersonsList = memo(function ContactPersonsList({team}) {
    return (
        <>
            <List dense>
                {team.contact_persons.map((person) => (
                    <ContactPersonItem person={person} key={person.id}/>
                ))}
            </List>
        </>
    )
});

export default ContactPersonsList;