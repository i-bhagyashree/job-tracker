import mongoose from 'mongoose';

export const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const JOB_TYPES = ['internship', 'full-time', 'part-time', 'contract'];
export const WORK_MODES = ['onsite', 'remote', 'hybrid'];

const historySchema = new mongoose.Schema(
  { status: { type: String, enum: STATUSES }, at: { type: Date, default: Date.now } },
  { _id: false }
);

const taskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 200 },
  done: { type: Boolean, default: false },
});

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    status: { type: String, enum: STATUSES, default: 'wishlist' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    jobType: { type: String, enum: JOB_TYPES, default: 'internship' },
    workMode: { type: String, enum: [...WORK_MODES, ''], default: '' },
    location: { type: String, trim: true, default: '' },
    jobUrl: { type: String, trim: true, default: '' },
    salary: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
    appliedDate: { type: Date },
    followUpDate: { type: Date },
    interviewDate: { type: Date },
    contactName: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    contactLinkedin: { type: String, trim: true, default: '' },
    history: { type: [historySchema], default: [] },
    tasks: { type: [taskSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Application', applicationSchema);
