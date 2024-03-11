import { memo, useCallback } from 'react';

import CallIcon from '@mui/icons-material/Call';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { useUpdateContactPersonMutation } from '../../services/linker.ts';
import { ContactPerson, Team } from '../../services/types.ts';

interface ContactPersonItemProps {
  person: ContactPerson;
}

const ContactPersonItem = memo(function ContactPersonItem({ person }: ContactPersonItemProps) {
  const updateContactPerson = useUpdateContactPersonMutation()[0];

  const copyPhoneNumber = useCallback(() => {
    navigator.clipboard.writeText(person.phone_number);
  }, [person]);

  const toggleFavorite = useCallback(() => {
    updateContactPerson({
      ...person,
      is_favorite: !person.is_favorite,
    });
  }, [updateContactPerson, person]);

  return (
    <ListItem
      key={person.id}
      disablePadding
      secondaryAction={
        <>
          <IconButton onClick={toggleFavorite}>
            {person.is_favorite ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
          <IconButton edge="end" disabled={!person.phone_number} onClick={copyPhoneNumber}>
            <ContentCopyIcon />
          </IconButton>
        </>
      }
    >
      <ListItemButton
        component="a"
        href={`tel:${person.phone_number}`}
        disabled={!person.phone_number}
      >
        <ListItemIcon>
          <CallIcon />
        </ListItemIcon>
        <ListItemText
          primary={person.name}
          secondary={person.phone_number ? person.phone_number : '-'}
        />
      </ListItemButton>
    </ListItem>
  );
});

interface ContactPersonsListProps {
  team: Team;
}

const ContactPersonsList = memo(function ContactPersonsList({ team }: ContactPersonsListProps) {
  return (
    <>
      <List dense>
        {team.contact_persons.map((person: ContactPerson) => (
          <ContactPersonItem person={person} key={person.id} />
        ))}
      </List>
    </>
  );
});

export default ContactPersonsList;
