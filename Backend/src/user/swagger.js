export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Health Queue API',
    version: '1.0.0',
    description: 'API documentation for authentication, hospitals, doctors, and appointments.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health check' },
    { name: 'Auth', description: 'Authentication and profile endpoints' },
    { name: 'Hospitals', description: 'Hospital management endpoints' },
    { name: 'Doctors', description: 'Doctor management endpoints' },
    { name: 'Appointments', description: 'Appointment booking endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Unable to fetch appointments' },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Test User' },
          email: { type: 'string', format: 'email', example: 'testuser1@gmail.com' },
          role: { type: 'string', example: 'patient' },
          id_card: { type: 'string', example: '1234567890123' },
          date_of_birth: { type: 'string', format: 'date', nullable: true },
          age: { type: 'integer', nullable: true, example: 26 },
          gender: { type: 'string', nullable: true, example: 'ชาย' },
          height: { type: 'number', nullable: true, example: 170 },
          weight: { type: 'number', nullable: true, example: 65 },
          medical_conditions: { type: 'string', nullable: true, example: '' },
          allergies: { type: 'string', nullable: true, example: '' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'idCard'],
        properties: {
          name: { type: 'string', example: 'Test User' },
          email: { type: 'string', format: 'email', example: 'testuser1@gmail.com' },
          password: { type: 'string', example: 'password123' },
          idCard: { type: 'string', example: '1234567890123' },
          dateOfBirth: { type: 'string', format: 'date', nullable: true },
          age: { type: 'integer', nullable: true, example: 26 },
          gender: { type: 'string', nullable: true, example: 'ชาย' },
          height: { type: 'number', nullable: true, example: 170 },
          weight: { type: 'number', nullable: true, example: 65 },
          medicalConditions: { type: 'string', nullable: true, example: '' },
          allergies: { type: 'string', nullable: true, example: '' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'testuser1@gmail.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Login successful' },
          user: { $ref: '#/components/schemas/UserProfile' },
          token: { type: 'string', example: 'jwt-token-here' },
        },
      },
      Hospital: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Health Queue Hospital' },
          address: { type: 'string', example: 'Bangkok' },
          phone: { type: 'string', example: '02-000-0000' },
          email: { type: 'string', format: 'email', example: 'contact@hospital.test' },
          website: { type: 'string', example: 'https://hospital.test' },
          logo: { type: 'string', example: 'https://hospital.test/logo.png' },
          image: { type: 'string', example: 'https://hospital.test/logo.png' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      HospitalInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Health Queue Hospital' },
          address: { type: 'string', example: 'Bangkok' },
          phone: { type: 'string', example: '02-000-0000' },
          email: { type: 'string', format: 'email', example: 'contact@hospital.test' },
          website: { type: 'string', example: 'https://hospital.test' },
          logo: { type: 'string', example: 'https://hospital.test/logo.png' },
        },
      },
      HospitalLogoInput: {
        type: 'object',
        required: ['logo'],
        properties: {
          logo: { type: 'string', example: 'https://hospital.test/logo.png' },
        },
      },
      Doctor: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Dr. Somchai' },
          specialty: { type: 'string', example: 'Cardiology' },
          licenseNumber: { type: 'string', example: 'LIC-001' },
          phone: { type: 'string', example: '02-111-1111' },
          email: { type: 'string', format: 'email', example: 'doctor@hospital.test' },
          hospitalId: { type: 'integer', nullable: true, example: 1 },
          hospital: { type: 'string', example: 'Health Queue Hospital' },
          experienceYears: { type: 'integer', example: 10 },
          image: { type: 'string', example: 'https://hospital.test/doctor.png' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DoctorInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Dr. Somchai' },
          specialty: { type: 'string', example: 'Cardiology' },
          licenseNumber: { type: 'string', example: 'LIC-001' },
          phone: { type: 'string', example: '02-111-1111' },
          email: { type: 'string', format: 'email', example: 'doctor@hospital.test' },
          hospitalId: { type: 'integer', nullable: true, example: 1 },
          hospital: { type: 'string', example: 'Health Queue Hospital' },
          experienceYears: { type: 'integer', example: 10 },
          image: { type: 'string', example: 'https://hospital.test/doctor.png' },
        },
      },
      AppointmentSlot: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date', example: '2026-03-30' },
          time: { type: 'string', example: '09:30' },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          status: { type: 'string', example: 'new' },
          patient: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Test User' },
              email: { type: 'string', format: 'email', example: 'testuser1@gmail.com' },
              phone: { type: 'string', example: '0812345678' },
              idCard: { type: 'string', example: '1234567890123' },
            },
          },
          clinic: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Health Queue Hospital' },
            },
          },
          appointmentType: { type: 'string', example: 'ตรวจทั่วไป' },
          doctorSelectionType: { type: 'string', example: 'specific' },
          selectedSpecialty: { type: 'string', example: 'อายุรกรรม' },
          selectedSpecialtyDetail: { type: 'string', example: 'หัวใจ' },
          selectedDoctor: { type: 'string', example: 'Dr. Somchai' },
          appointments: {
            type: 'array',
            items: { $ref: '#/components/schemas/AppointmentSlot' },
          },
          date: { type: 'string', format: 'date', example: '2026-03-30' },
          time: { type: 'string', example: '09:30' },
          symptoms: { type: 'string', example: 'ปวดหัว' },
          attachedFiles: { type: 'array', items: { type: 'object' } },
          relationship: { type: 'string', example: 'self' },
          gender: { type: 'string', example: 'ชาย' },
          birthDate: { type: 'string', format: 'date', nullable: true },
          nationality: { type: 'string', example: 'ไทย' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AppointmentCreateRequest: {
        type: 'object',
        required: ['patient', 'clinic'],
        properties: {
          id: { type: 'string', example: 'REQ-1001' },
          status: { type: 'string', example: 'new' },
          patient: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Test User' },
              email: { type: 'string', format: 'email', example: 'testuser1@gmail.com' },
              phone: { type: 'string', example: '0812345678' },
              idCard: { type: 'string', example: '1234567890123' },
            },
          },
          clinic: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Health Queue Hospital' },
            },
          },
          appointmentType: { type: 'string', example: 'ตรวจทั่วไป' },
          doctorSelectionType: { type: 'string', example: 'specific' },
          selectedSpecialty: { type: 'string', example: 'อายุรกรรม' },
          selectedSpecialtyDetail: { type: 'string', example: 'หัวใจ' },
          selectedDoctor: { type: 'string', example: 'Dr. Somchai' },
          appointments: {
            type: 'array',
            items: { $ref: '#/components/schemas/AppointmentSlot' },
          },
          date: { type: 'string', format: 'date', example: '2026-03-30' },
          time: { type: 'string', example: '09:30' },
          symptoms: { type: 'string', example: 'ปวดหัว' },
          attachedFiles: { type: 'array', items: { type: 'object' } },
          relationship: { type: 'string', example: 'self' },
          gender: { type: 'string', example: 'ชาย' },
          birthDate: { type: 'string', format: 'date', nullable: true },
          nationality: { type: 'string', example: 'ไทย' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check backend health',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    time: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new patient account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User registered successfully' },
                    user: { $ref: '#/components/schemas/UserProfile' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get the profile of the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Authenticated profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/UserProfile' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Missing token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out the current user on the client side',
        responses: {
          200: {
            description: 'Logout acknowledged',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/hospitals': {
      get: {
        tags: ['Hospitals'],
        summary: 'List hospitals',
        responses: {
          200: {
            description: 'Hospital list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    hospitals: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Hospital' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Hospitals'],
        summary: 'Create a hospital',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HospitalInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Hospital created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Hospital created' },
                    hospital: { $ref: '#/components/schemas/Hospital' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/hospitals/{id}': {
      get: {
        tags: ['Hospitals'],
        summary: 'Get a hospital by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Hospital found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    hospital: { $ref: '#/components/schemas/Hospital' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Hospital not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Hospitals'],
        summary: 'Update a hospital',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HospitalInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Hospital updated',
          },
        },
      },
      delete: {
        tags: ['Hospitals'],
        summary: 'Delete a hospital',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Hospital deleted',
          },
        },
      },
    },
    '/api/hospitals/{id}/logo': {
      post: {
        tags: ['Hospitals'],
        summary: 'Update a hospital logo URL',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HospitalLogoInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Logo updated',
          },
        },
      },
    },
    '/api/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'List doctors',
        parameters: [
          {
            name: 'hospitalId',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Doctor list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    doctors: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Doctor' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Doctors'],
        summary: 'Create a doctor',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DoctorInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Doctor created',
          },
        },
      },
    },
    '/api/doctors/{id}': {
      get: {
        tags: ['Doctors'],
        summary: 'Get a doctor by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'Doctor found' },
          404: { description: 'Doctor not found' },
        },
      },
      put: {
        tags: ['Doctors'],
        summary: 'Update a doctor',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DoctorInput' },
            },
          },
        },
        responses: {
          200: { description: 'Doctor updated' },
        },
      },
      delete: {
        tags: ['Doctors'],
        summary: 'Delete a doctor',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'Doctor deleted' },
        },
      },
    },
    '/api/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments',
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Filter appointments by patient id',
          },
        ],
        responses: {
          200: {
            description: 'Appointment list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Appointment' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Create a new appointment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppointmentCreateRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Appointment created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Appointment created' },
                    appointment: { $ref: '#/components/schemas/Appointment' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
};