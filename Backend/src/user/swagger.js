export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Health Queue API',
    version: '1.0.0',
    description: 'เอกสาร API สำหรับระบบยืนยันตัวตน โรงพยาบาล แพทย์ และการนัดหมาย',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'เซิร์ฟเวอร์พัฒนาในเครื่อง',
    },
  ],
  tags: [
    { name: 'Health', description: 'ตรวจสอบสถานะเซิร์ฟเวอร์' },
    { name: 'Auth', description: 'API สำหรับระบบเข้าสู่ระบบและโปรไฟล์ผู้ใช้' },
    { name: 'Users', description: 'API สำหรับจัดการผู้ใช้และบทบาท' },
    { name: 'Hospitals', description: 'API สำหรับจัดการโรงพยาบาลและคลินิก' },
    { name: 'Doctors', description: 'API สำหรับจัดการข้อมูลแพทย์' },
    { name: 'Appointments', description: 'API สำหรับจัดการการนัดหมาย' },
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
          error: { type: 'string', example: 'ไม่สามารถดึงข้อมูลนัดหมายได้' },
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
          message: { type: 'string', example: 'เข้าสู่ระบบสำเร็จ' },
          user: { $ref: '#/components/schemas/UserProfile' },
          token: { type: 'string', example: 'jwt-token-here' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Kittinun Chanyan' },
          phone: { type: 'string', nullable: true, example: '0812345678' },
          idCard: { type: 'string', nullable: true, example: '1234567890123' },
          dateOfBirth: { type: 'string', format: 'date', nullable: true, example: '2005-09-09' },
          age: { type: 'integer', nullable: true, example: 20 },
          gender: { type: 'string', nullable: true, example: 'หญิง' },
          height: { type: 'number', nullable: true, example: 170 },
          weight: { type: 'number', nullable: true, example: 65 },
          medicalConditions: { type: 'string', nullable: true, example: '-' },
          allergies: { type: 'string', nullable: true, example: '-' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'password123' },
          newPassword: { type: 'string', minLength: 8, example: 'newPassword123' },
        },
      },
      UserRoleUpdateRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', example: 'admin' },
        },
      },
      UserListResponse: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserProfile' },
          },
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
          phone: { type: 'string', example: '02-111-1111' },
          email: { type: 'string', format: 'email', example: 'doctor@hospital.test' },
          hospitalId: { type: 'integer', nullable: true, example: 1 },
          hospital: { type: 'string', example: 'Health Queue Hospital' },
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
          phone: { type: 'string', example: '02-111-1111' },
          email: { type: 'string', format: 'email', example: 'doctor@hospital.test' },
          hospitalId: { type: 'integer', nullable: true, example: 1 },
          hospital: { type: 'string', example: 'Health Queue Hospital' },
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
        summary: 'ตรวจสอบสถานะเซิร์ฟเวอร์',
        responses: {
          200: {
            description: 'ระบบพร้อมใช้งาน',
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
        summary: 'ลงทะเบียนบัญชีผู้ป่วยใหม่',
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
            description: 'ลงทะเบียนผู้ใช้สำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'ลงทะเบียนสำเร็จ' },
                    user: { $ref: '#/components/schemas/UserProfile' },
                  },
                },
              },
            },
          },
          400: {
            description: 'ข้อมูลไม่ถูกต้อง',
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
        summary: 'เข้าสู่ระบบและรับโทเค็น JWT',
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
            description: 'เข้าสู่ระบบสำเร็จ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: {
            description: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
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
        summary: 'ดูข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอิน',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'ข้อมูลโปรไฟล์ผู้ใช้',
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
            description: 'ไม่มีโทเค็นยืนยันตัวตน',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'โทเค็นไม่ถูกต้อง',
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
        summary: 'ออกจากระบบผู้ใช้ปัจจุบัน',
        responses: {
          200: {
            description: 'ออกจากระบบสำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'ออกจากระบบสำเร็จ' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/user/profile': {
      put: {
        tags: ['Auth'],
        summary: 'แก้ไขข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอิน',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'อัปเดตโปรไฟล์สำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'อัปเดตโปรไฟล์สำเร็จ' },
                    user: { $ref: '#/components/schemas/UserProfile' },
                  },
                },
              },
            },
          },
          400: {
            description: 'ข้อมูลไม่ถูกต้อง',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'ไม่มีโทเค็นยืนยันตัวตน',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'โทเค็นไม่ถูกต้อง',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/user/password': {
      put: {
        tags: ['Auth'],
        summary: 'เปลี่ยนรหัสผ่านของผู้ใช้ที่ล็อกอิน',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'เปลี่ยนรหัสผ่านสำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'เปลี่ยนรหัสผ่านสำเร็จ' },
                  },
                },
              },
            },
          },
          400: {
            description: 'ข้อมูลไม่ถูกต้องหรือรหัสผ่านปัจจุบันไม่ถูกต้อง',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'ไม่มีโทเค็นยืนยันตัวตน',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'โทเค็นไม่ถูกต้อง',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/user/account': {
      delete: {
        tags: ['Auth'],
        summary: 'ลบบัญชีผู้ใช้ที่ล็อกอิน',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'ลบบัญชีสำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'ลบบัญชีสำเร็จ' },
                  },
                },
              },
            },
          },
          401: {
            description: 'ไม่มีโทเค็นยืนยันตัวตน',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'โทเค็นไม่ถูกต้อง',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          500: {
            description: 'ไม่สามารถลบบัญชีได้',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/user/list': {
      get: {
        tags: ['Users'],
        summary: 'ดึงรายชื่อผู้ใช้ทั้งหมดสำหรับผู้ดูแลระบบ',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'รายการผู้ใช้',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserListResponse' },
              },
            },
          },
          401: {
            description: 'ไม่มีโทเค็นยืนยันตัวตน',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'ต้องเป็นผู้ดูแลระบบเท่านั้น',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/user/{id}': {
      get: {
        tags: ['Users'],
        summary: 'ดึงข้อมูลผู้ใช้ตาม ID สำหรับผู้ดูแลระบบ',
        security: [{ bearerAuth: [] }],
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
            description: 'พบผู้ใช้',
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
            description: 'ไม่มีโทเค็นยืนยันตัวตน',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'ต้องเป็นผู้ดูแลระบบเท่านั้น',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'ไม่พบผู้ใช้',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/user/{id}/role': {
      put: {
        tags: ['Users'],
        summary: 'แก้ไขบทบาทผู้ใช้สำหรับผู้ดูแลระบบ',
        security: [{ bearerAuth: [] }],
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
              schema: { $ref: '#/components/schemas/UserRoleUpdateRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'ปรับบทบาทผู้ใช้สำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User role updated' },
                    user: { $ref: '#/components/schemas/UserProfile' },
                  },
                },
              },
            },
          },
          400: {
            description: 'บทบาทไม่ถูกต้อง',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'ไม่มีโทเค็นยืนยันตัวตน',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'ต้องเป็นผู้ดูแลระบบเท่านั้น',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'ไม่พบผู้ใช้',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/hospitals': {
      get: {
        tags: ['Hospitals'],
        summary: 'ดึงรายชื่อโรงพยาบาล/คลินิก',
        responses: {
          200: {
            description: 'รายการโรงพยาบาล/คลินิก',
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
        summary: 'สร้างโรงพยาบาล/คลินิกใหม่',
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
            description: 'สร้างโรงพยาบาล/คลินิกสำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'สร้างโรงพยาบาลสำเร็จ' },
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
        summary: 'ดึงรายละเอียดโรงพยาบาล/คลินิกตาม ID',
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
            description: 'พบโรงพยาบาล/คลินิก',
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
            description: 'ไม่พบโรงพยาบาล/คลินิก',
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
        summary: 'แก้ไขข้อมูลโรงพยาบาล/คลินิก',
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
            description: 'แก้ไขโรงพยาบาลสำเร็จ',
          },
        },
      },
      delete: {
        tags: ['Hospitals'],
        summary: 'ลบโรงพยาบาล/คลินิก',
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
            description: 'ลบโรงพยาบาลสำเร็จ',
          },
        },
      },
    },
    '/api/hospitals/{id}/logo': {
      post: {
        tags: ['Hospitals'],
        summary: 'อัปเดตรูปโลโก้โรงพยาบาล',
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
            description: 'อัปเดตรูปโลโก้สำเร็จ',
          },
        },
      },
    },
    '/api/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'ดึงรายชื่อแพทย์',
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
            description: 'รายการแพทย์',
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
        summary: 'เพิ่มข้อมูลแพทย์ใหม่',
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
            description: 'สร้างข้อมูลแพทย์สำเร็จ',
          },
        },
      },
    },
    '/api/doctors/{id}': {
      get: {
        tags: ['Doctors'],
        summary: 'ดึงข้อมูลแพทย์ตาม ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'พบแพทย์' },
          404: { description: 'ไม่พบแพทย์' },
        },
      },
      put: {
        tags: ['Doctors'],
        summary: 'แก้ไขข้อมูลแพทย์',
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
          200: { description: 'แก้ไขข้อมูลแพทย์สำเร็จ' },
        },
      },
      delete: {
        tags: ['Doctors'],
        summary: 'ลบแพทย์',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'ลบแพทย์สำเร็จ' },
        },
      },
    },
    '/api/doctors/{id}/image': {
      post: {
        tags: ['Doctors'],
        summary: 'อัปโหลดรูปภาพโปรไฟล์แพทย์',
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
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'ไฟล์รูปภาพ (jpg, png, webp, ฯลฯ) ขนาดไม่เกิน 2MB',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'อัปเดตรูปแพทย์สำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'อัปเดตรูปแพทย์สำเร็จ' },
                    doctor: { $ref: '#/components/schemas/Doctor' },
                  },
                },
              },
            },
          },
          400: { description: 'ไม่มีไฟล์หรือไฟล์ขนาดใหญ่เกิน/ประเภทไม่ถูกต้อง' },
          404: { description: 'ไม่พบแพทย์' },
        },
      },
    },
    '/api/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'ดึงรายการนัดหมาย',
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'กรองนัดหมายตามรหัสผู้ป่วย',
          },
        ],
        responses: {
          200: {
            description: 'รายการนัดหมาย',
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
        summary: 'สร้างนัดหมายใหม่',
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
            description: 'สร้างนัดหมายสำเร็จ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'สร้างนัดหมายสำเร็จ' },
                    appointment: { $ref: '#/components/schemas/Appointment' },
                  },
                },
              },
            },
          },
          400: {
            description: 'ข้อมูลจำเป็นบางอย่างหายไป',
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