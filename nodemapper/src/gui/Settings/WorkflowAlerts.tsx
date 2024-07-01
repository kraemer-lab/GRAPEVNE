import React from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import {
  builderToggleWorkflowAlertOnSuccessEnabled,
  builderToggleWorkflowAlertOnErrorEnabled,
  builderSetWorkflowAlertsEmailSMTPServer,
  builderSetWorkflowAlertsEmailSMTPPort,
  builderSetWorkflowAlertsEmailUsername,
  builderSetWorkflowAlertsEmailPassword,
  builderSetWorkflowAlertsOnSuccessSubject,
  builderSetWorkflowAlertsOnSuccessBody,
  builderSetWorkflowAlertsOnErrorSubject,
  builderSetWorkflowAlertsOnErrorBody,
} from 'redux/actions';
import { useTheme } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

interface IInputItem {
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  labelWidth: string;
}

const InputItem = ({id, type, label, value, onChange, labelWidth}: IInputItem) => {
  if (type === undefined) {
    type = 'text';
  }
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '10px',
        flexDirection: 'row',
      }}
    >
      <Box
        sx={{
          width: labelWidth,
          textAlign: 'right',
          alignSelf: 'center',
        }}
      >
        <Typography variant="body1">{label}</Typography>
      </Box>
      <TextField
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        style={{ width: '100%' }}
        size="small"
      />
    </Box>
  )
} 

interface IEmailSettings {
  labelWidth: string;
}

const EmailSettings = ({labelWidth}: IEmailSettings) => {
  const dispatch = useAppDispatch();
  const email_settings = useAppSelector(
    (state) => state.builder.workflow_alerts.email_settings,
  );
  const setSMTPServer = (value: string) => dispatch(builderSetWorkflowAlertsEmailSMTPServer(value));
  const setSMTPPort = (value: string) => {
    if (isNaN(parseInt(value))) {
      alert('Port must be a number');
      return;
    }
    dispatch(builderSetWorkflowAlertsEmailSMTPPort(value));
  };
  const setUsername = (value: string) => dispatch(builderSetWorkflowAlertsEmailUsername(value));
  const setPassword = (value: string) => dispatch(builderSetWorkflowAlertsEmailPassword(value));

  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <InputItem
        id="settings_workflow_alerts_email_smtp_server"
        label="SMTP Server:"
        value={email_settings.smtp_server}
        onChange={(e) => setSMTPServer(e.target.value)}
        labelWidth={labelWidth}
      />
      <InputItem
        id="settings_workflow_alerts_email_smtp_port"
        label="SMTP Port:"
        value={email_settings.smtp_port.toString()}
        onChange={(e) => setSMTPPort(e.target.value)}
        labelWidth={labelWidth}
      />
      <InputItem
        id="settings_workflow_alerts_email_username"
        label="Username:"
        value={email_settings.username}
        onChange={(e) => setUsername(e.target.value)}
        labelWidth={labelWidth}
      />
      <InputItem
        id="settings_workflow_alerts_email_password"
        type="password"
        label="Password:"
        value={email_settings.password}
        onChange={(e) => setPassword(e.target.value)}
        labelWidth={labelWidth}
      />
    </Box>
  )
}

interface IWorkflowAlertSettings {
  labelWidth: string;
  alert_type: string;
  setSubject: (value: string) => void;
  setBody: (value: string) => void;
}

const WorkflowAlertSettings = ({labelWidth, alert_type, setSubject, setBody}: IWorkflowAlertSettings) => {
  const message = useAppSelector(
    (state) => state.builder.workflow_alerts[alert_type].message,
  );
  
  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <InputItem
        id="settings_workflow_alerts_email_subject"
        label="Subject:"
        value={message.subject}
        onChange={(e) => setSubject(e.target.value)}
        labelWidth={labelWidth}
      />
      <InputItem
        id="settings_workflow_alerts_email_message"
        label="Message:"
        value={message.body}
        onChange={(e) => setBody(e.target.value)}
        labelWidth={labelWidth}
      />
    </Box>
  )
}

interface IWorkflowAlerts {
  labelWidth: string;
}

const WorkflowAlerts = ({labelWidth}: IWorkflowAlerts) => {
  const dispatch = useAppDispatch();
  const settings_onsuccess = useAppSelector(
    (state) => state.builder.workflow_alerts.onsuccess,
  );
  const settings_onerror = useAppSelector(
    (state) => state.builder.workflow_alerts.onerror,
  );
  const theme = useTheme();
  
  return (
    <>
      <Typography variant="h6">Workflow Alerts</Typography>
      <Typography variant="body1">
        Configure email alerts for workflow success and failure.
      </Typography>
      <Typography variant="body1" sx={{ color: theme.palette.warning.main }}>
        Warning: Your email username and password will be stored in a plain text file.
      </Typography>
      <FormGroup>
        <EmailSettings labelWidth={labelWidth} />
        <FormControlLabel
          control={
            <Checkbox
              id="settings_workflow_alerts_onsuccess_enabled"
              checked={settings_onsuccess.enabled}
              onChange={(e) => dispatch(builderToggleWorkflowAlertOnSuccessEnabled(e.target.checked))}
            />
          }
          label="Enable success alert"
        />
        {(settings_onsuccess.enabled) ? (
          <WorkflowAlertSettings
            labelWidth={labelWidth}
            alert_type="onsuccess"
            setSubject={(value: string) => dispatch(builderSetWorkflowAlertsOnSuccessSubject(value))}
            setBody={(value: string) => dispatch(builderSetWorkflowAlertsOnSuccessBody(value))}
          />
        ) : null}
        <FormControlLabel
          control={
            <Checkbox
              id="settings_workflow_alerts_onerror_enabled"
              checked={settings_onerror.enabled}
              onChange={(e) => dispatch(builderToggleWorkflowAlertOnErrorEnabled(e.target.checked))}
            />
          }
          label="Enable failure alert"
        />
        {(settings_onerror.enabled) ? (
          <WorkflowAlertSettings
            labelWidth={labelWidth}
            alert_type="onerror"
            setSubject={(value: string) => dispatch(builderSetWorkflowAlertsOnErrorSubject(value))}
            setBody={(value: string) => dispatch(builderSetWorkflowAlertsOnErrorBody(value))}
          />
        ) : null}
      </FormGroup>
    </>
  )
}

export default WorkflowAlerts;
