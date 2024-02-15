import React, { useState } from "react";
import { Link as RouterLink, useLocation, useHistory } from "react-router-dom";
import { useStyles } from "./style";
import * as Yup from "yup";
import { Formik } from "formik";
import { CREATE_USER_MUTATION } from "../../lib/apollo/mutations/authMutations";
import { useMutation } from "@apollo/client";
import { RegisterUserInput } from "../../types";
import {
  Box,
  Checkbox,
  Container,
  FormHelperText,
  Link,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import ButtonComponent from "../common/Button";
import TooltipComponent from "../common/Tooltip";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ConfirmInvitationComponent() {
  const classes = useStyles();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  const [registerUser, { loading, data }] = useMutation(CREATE_USER_MUTATION);
  const query: URLSearchParams = useQuery();

  const token: string | null = query.get("token");
  if (!token) {
    history.push("/");
  }

  return (
    <div className={classes.root}>
      <Box
        display="flex"
        flexDirection="column"
        height="100%"
        justifyContent="center"
        className={classes.registerBox}
      >
        <Container maxWidth="sm">
          <Formik
            initialValues={{
              firstName: "",
              lastName: "",
              password: "",
              confirmPassword: "",
              invitationToken: token ? token : "",
              policy: false,
            }}
            validationSchema={Yup.object().shape({
              firstName: Yup.string()
                .max(80, "First name must be at most 80 characters")
                .required("First name is required"),
              lastName: Yup.string()
                .max(80, "Last name must be at most 80 characters")
                .required("Last name is required"),
              password: Yup.string()
                .min(8, "Password must be at least 8 characters")
                .max(15, "Password must be at most 15 characters")
                .matches(
                  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/,
                  "Password should be between 8 to 15 characters which contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character"
                )
                .required("Password is required"),
              confirmPassword: Yup.string()
                .oneOf([Yup.ref("password")], "Passwords must match")
                .required("Confirm Password is required"),
              policy: Yup.boolean().oneOf(
                [true],
                "Please agree with Terms and Conditions in order to proceed"
              ),
            })}
            onSubmit={(values) => {
              return new Promise(async (resolve, reject) => {
                const formData: RegisterUserInput = {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  invitationToken: values.invitationToken,
                  password: values.password,
                };
                const {
                  data: {
                    createUser: { user, response },
                  },
                } = await registerUser({
                  variables: { user: formData },
                });
                if (user) {
                  enqueueSnackbar(
                    "You've successfully accepted the invite. Please log in to continue.",
                    { variant: "success" }
                  );
                  history.push("/");
                  resolve(
                    "You've successfully accepted the invite. Please log in to continue."
                  );
                } else {
                  enqueueSnackbar(
                    response.error ? response.error : response.message,
                    {
                      variant: "error",
                    }
                  );
                  reject(response.error ? response.error : response.message);
                }
              });
            }}
          >
            {({
              errors,
              handleBlur,
              handleChange,
              handleSubmit,
              isSubmitting,
              touched,
              values,
            }) => (
              <form onSubmit={handleSubmit}>
                <Box mb={3}>
                  <Typography color="textPrimary" variant="h2">
                    Register
                  </Typography>
                </Box>
                <TextField
                  error={Boolean(touched.firstName && errors.firstName)}
                  fullWidth
                  helperText={touched.firstName && errors.firstName}
                  label="First name"
                  margin="normal"
                  name="firstName"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.firstName}
                  variant="outlined"
                />
                <TextField
                  error={Boolean(touched.lastName && errors.lastName)}
                  fullWidth
                  helperText={touched.lastName && errors.lastName}
                  label="Last name"
                  margin="normal"
                  name="lastName"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.lastName}
                  variant="outlined"
                />

                <FormControl
                  variant="outlined"
                  className={classes.passwordField}
                >
                  <InputLabel>Password</InputLabel>
                  <OutlinedInput
                    error={Boolean(touched.password && errors.password)}
                    type="password"
                    label="Password"
                    name="password"
                    onBlur={handleBlur}
                    value={values.password}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <TooltipComponent />
                      </InputAdornment>
                    }
                  />
                  <FormHelperText>
                    {touched.password && errors.password}
                  </FormHelperText>
                </FormControl>

                <TextField
                  error={Boolean(
                    touched.confirmPassword && errors.confirmPassword
                  )}
                  fullWidth
                  helperText={touched.confirmPassword && errors.confirmPassword}
                  label="Confirm Password"
                  margin="normal"
                  name="confirmPassword"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  type="password"
                  value={values.confirmPassword}
                  variant="outlined"
                />

                <Box alignItems="center" display="flex" ml={-1}>
                  <Checkbox
                    checked={values.policy}
                    name="policy"
                    onChange={handleChange}
                  />
                  <Typography color="textSecondary" variant="body1">
                    I have read the{" "}
                    <Link
                      color="primary"
                      component={RouterLink}
                      to="/terms"
                      target="_blank"
                      underline="always"
                      variant="h6"
                    >
                      Terms and Conditions
                    </Link>
                  </Typography>
                </Box>
                {Boolean(touched.policy && errors.policy) && (
                  <FormHelperText error>{errors.policy}</FormHelperText>
                )}
                <Box my={2}>
                  <ButtonComponent
                    color={"primary"}
                    disabled={isSubmitting}
                    fullWidth={true}
                    size="large"
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    text="Register"
                  />
                </Box>
                <Typography color="textSecondary" variant="body1">
                  Have an account?{" "}
                  <Link component={RouterLink} to="/" variant="h6">
                    Sign in
                  </Link>
                </Typography>
              </form>
            )}
          </Formik>
        </Container>
      </Box>
    </div>
  );
}
