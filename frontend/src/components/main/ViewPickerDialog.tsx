import { useCallback } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import {
  Dialog,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
} from '@mui/material';

import { useGetUserQuery } from '../../services/linker.ts';
import {
  type ViewFilters,
  filterActions,
  getAvailableViews,
  useAppDispatch,
  useAppSelector,
} from '../../store';

interface ViewPickerDialogProps {
  open: boolean;
  onClose: () => void;
}

// The team-safety "sliders". Picking a view sets these; flipping one manually
// switches the active view to "custom".
const TEAM_FILTER_TOGGLES: {
  key: keyof ViewFilters;
  label: string;
  action: () => { type: string };
}[] = [
  { key: 'showUnsafe', label: 'Toon onveilige teams', action: filterActions.toggleShowUnsafe },
  { key: 'showMaybe', label: 'Toon maybe teams', action: filterActions.toggleShowMaybe },
  {
    key: 'showSlotweide',
    label: 'Toon slotweide teams',
    action: filterActions.toggleShowSlotweide,
  },
  { key: 'showBus', label: 'Toon teams op de bus', action: filterActions.toggleShowBus },
];

export default function ViewPickerDialog({ open, onClose }: ViewPickerDialogProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filter);
  const activeViewId = filters.activeViewId;

  const { data: user } = useGetUserQuery();
  const availableViews = getAvailableViews(user?.permissions ?? []);
  const canViewTeamDetails = Boolean(user?.permissions.includes('view_team_details'));

  const onSelectView = useCallback(
    (viewId: string) => {
      dispatch(filterActions.applyView(viewId));
    },
    [dispatch],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Weergave</DialogTitle>
      <List>
        {availableViews.map((view) => (
          <ListItemButton
            key={view.id}
            selected={view.id === activeViewId}
            onClick={() => onSelectView(view.id)}
          >
            <ListItemIcon>{view.id === activeViewId && <CheckIcon />}</ListItemIcon>
            <ListItemText primary={view.label} secondary={view.description} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      {/* Organisatie toggle: independent of the selected view. */}
      <List>
        <ListItemButton onClick={() => dispatch(filterActions.toggleShowMembers())}>
          <ListItemText primary="Toon organisatie" />
          <Switch edge="end" checked={filters.showMembers} tabIndex={-1} disableRipple />
        </ListItemButton>
      </List>
      {canViewTeamDetails && (
        <>
          <Divider />
          <List subheader={<ListSubheader>Filters</ListSubheader>}>
            {TEAM_FILTER_TOGGLES.map((toggle) => (
              <ListItemButton key={toggle.key} onClick={() => dispatch(toggle.action())}>
                <ListItemText primary={toggle.label} />
                <Switch edge="end" checked={filters[toggle.key]} tabIndex={-1} disableRipple />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </Dialog>
  );
}
