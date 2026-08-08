import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueryPowerBiDto } from './dto/query-powerbi.dto';

@Injectable()
export class PowerBiService {
  constructor(private dataSource: DataSource) { }

  private getDbName(region: 'm3south' | 'm3north' | 'm3infrastructure'): string {
    switch (region) {
      case 'm3south':
        return process.env.DB_SOUTH_NAME || 'south_testing_db';
      case 'm3north':
        return process.env.DB_NORTH_NAME || 'north_testing_db';
      case 'm3infrastructure':
        return process.env.DB_INFRA_NAME || 'testing_database';
    }
  }

  private async executeQuery(sql: string, params: any[] = []): Promise<any> {
    try {
      return await this.dataSource.query(sql, params);
    } catch (err: any) {
      if (err.message && (err.message.includes('ECONNRESET') || err.message.includes('closed'))) {
        console.warn('MySQL socket reset detected, retrying query once...');
        return await this.dataSource.query(sql, params);
      }
      throw err;
    }
  }

  async getRegionData(region: 'm3south' | 'm3north' | 'm3infrastructure', queryDto: QueryPowerBiDto) {
    const { tablename } = queryDto;
    if (!tablename) {
      throw new BadRequestException('Missing tablename parameter');
    }

    // Sanitize table name (only alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
      throw new BadRequestException('Invalid table name format');
    }

    let page = queryDto.page ? Math.max(1, Number(queryDto.page)) : 1;
    let limit = queryDto.limit ? Math.max(1, Number(queryDto.limit)) : 100;
    let start = (page - 1) * limit;

    if (queryDto.start !== undefined && queryDto.end !== undefined) {
      start = Math.max(0, Number(queryDto.start));
      const end = Math.max(start, Number(queryDto.end));
      limit = end - start + 1;
    }

    const dbName = this.getDbName(region);

    try {
      // Total count query
      const countResult = await this.executeQuery(
        `SELECT COUNT(*) as total FROM \`${dbName}\`.\`${tablename}\``,
      );
      const totalRows = countResult && countResult.length > 0 ? Number(countResult[0].total) : 0;

      // Paginated rows query
      let rows: any[] = [];
      if (tablename.toLowerCase() === 'requests') {
        try {
          rows = await this.executeQuery(
            `SELECT 
              r.*,
              rch.working_hazardious_substen, rch.relevant_mal, rch.msds, rch.equipment_taken_account, rch.ventilation, rch.hazardous_substances, rch.storage_and_disposal, rch.reachable_case, rch.checical_risk_assessment,
              rc.working_confined_spaces, rc.vapours_gases, rc.lel_measurement, rc.all_equipment, rc.exit_conditions, rc.communication_emergency, rc.rescue_equipments, rc.space_ventilation, rc.oxygen_meter,
              re.working_on_electrical_system, re.responsible_for_the_informed, re.de_energized, re.if_not_loto, re.do_risk_assessment, re.electricity_have_isulation,
              ree.power_on, ree.energising_equipment, ree.isolating_live, ree.working_near_live, ree.responsible_for_the_area, ree.risk_assessment_done, ree.barriers_signage, ree.arc_flash, ree.energized_been_tested, ree.punches_been_closed, ree.toct_checklist, ree.informed_aligned, ree.isolating_responsible, ree.isolating_risk_assessment, ree.cq_informed, ree.cq_provided, ree.de_energisation_request, ree.ppe_prepared, ree.absence_of_voltage, ree.stored_energy, ree.backup_power, ree.unavoidable, ree.reasonably_practicable, ree.work_authorised, ree.working_risk_assessment, ree.working_arc_boundary, ree.working_barriers, ree.insulated_tools, ree.event_of_emergency,
              rem.pressurization, rem.performed_approved, rem.flushing_approved, rem.mc_approved, rem.visual_inspection, rem.loto_plan_approved, rem.follow_media_code, rem.cq_safety_signs, rem.mc_number_text,
              rexc.excavation_shoring, rexc.excavation_segregated, rexc.nn_standards, rexc.danish_regulation, rexc.safe_access_and_egress, rexc.correctly_sloped, rexc.inspection_dates, rexc.marked_drawings, rexc.underground_areas_cleared, rexc.excavation_works,
              remisc.Tools, remisc.Machinery, remisc.description_of_activity, remisc.mechanical_works, remisc.electrical_works, remisc.ConM_initials, remisc.ConM_initials1, remisc.CoMM_initials, remisc.reject_reason, remisc.cancel_reason, remisc.close_note, remisc.new_sub_contractor, remisc.work_type, remisc.rams_number,
              rfh.Hot_work, rfh.fire_watch_establish, rfh.combustible_material, rfh.safety_measures, rfh.extinguishers_and_fire_blanket, rfh.welding_activity, rfh.heat_treatment, rfh.air_extraction_be_established, rfh.name_of_the_fire_watcher, rfh.phone_number_of_the_fire_watcher, rfh.fire_guard_present, rfh.low_risk_hotwork, rfh.high_risk_hotwork, rfh.hot_work_checklist_filled, rfh.h_heat_source, rfh.h_workplace_check, rfh.h_fire_detectors, rfh.h_start_time, rfh.h_end_time, rfh.fire_image, rfh.tasks_in_progress_in_the_area, rfh.account_during_the_work, rfh.lighting_sufficiently, rfh.specific_risks_based_on_task, rfh.work_environment_safety_ensured, rfh.course_of_action_in_emergencies, rfh.if_no_loto, rfh.hazardaus_substances,
              rg.affecting_other_contractors, rg.other_conditions, rg.other_conditions_input, rg.lighting_begin_work, rg.specific_risks, rg.environment_ensured, rg.course_of_actions,
              rh.working_at_height, rh.segragated_demarkated, rh.lanyard_attachments, rh.rescue_plan, rh.avoid_hazards, rh.height_training, rh.height_equipments, rh.supervision, rh.shock_absorbing, rh.vertical_life, rh.secured_falling, rh.dropped_objects, rh.safe_acces, rh.weather_acceptable,
              rl.using_cranes_or_lifting, rl.appointed_person, rl.vendor_supplies, rl.lift_plan, rl.supplied_and_inspected, rl.legal_required_certificates, rl.prapared_lifting, rl.lifting_task_fenced, rl.overhead_risks,
              rppe.specific_gloves, rppe.eye_protection, rppe.fall_protection, rppe.hearing_protection, rppe.respiratory_protection, rppe.other_ppe,
              rpt.pressure_testing_of_equipment, rpt.line_walk, rpt.pressure_test_coordinated, rpt.pipework_mic, rpt.loto_plan_attached, rpt.exclusion_zone_calculated, rpt.pnematic_hydrostatic, rpt.pressure_of_the_test, rpt.safety_valves_calibrated, rpt.pressure_pneumatic, rpt.pressure_hydrostatic
            FROM \`${dbName}\`.\`requests\` r
            LEFT JOIN \`${dbName}\`.\`request_chemical_hazard\` rch ON r.id = rch.request_id
            LEFT JOIN \`${dbName}\`.\`request_confined\` rc ON r.id = rc.request_id
            LEFT JOIN \`${dbName}\`.\`request_electrical\` re ON r.id = re.request_id
            LEFT JOIN \`${dbName}\`.\`request_energising_electrical\` ree ON r.id = ree.request_id
            LEFT JOIN \`${dbName}\`.\`request_energising_mechanical\` rem ON r.id = rem.request_id
            LEFT JOIN \`${dbName}\`.\`request_excavation\` rexc ON r.id = rexc.request_id
            LEFT JOIN \`${dbName}\`.\`request_extra_misc\` remisc ON r.id = remisc.request_id
            LEFT JOIN \`${dbName}\`.\`request_fire_hotwork\` rfh ON r.id = rfh.request_id
            LEFT JOIN \`${dbName}\`.\`request_general\` rg ON r.id = rg.request_id
            LEFT JOIN \`${dbName}\`.\`request_height\` rh ON r.id = rh.request_id
            LEFT JOIN \`${dbName}\`.\`request_lifting\` rl ON r.id = rl.request_id
            LEFT JOIN \`${dbName}\`.\`request_ppe\` rppe ON r.id = rppe.request_id
            LEFT JOIN \`${dbName}\`.\`request_pressure_testing\` rpt ON r.id = rpt.request_id
            LIMIT ?, ?`,
            [start, limit],
          );
        } catch (joinErr: any) {
          console.warn(`Joined requests query failed, falling back to base table: ${joinErr.message}`);
          rows = await this.executeQuery(
            `SELECT * FROM \`${dbName}\`.\`${tablename}\` LIMIT ?, ?`,
            [start, limit],
          );
        }
      } else {
        rows = await this.executeQuery(
          `SELECT * FROM \`${dbName}\`.\`${tablename}\` LIMIT ?, ?`,
          [start, limit],
        );
      }

      // Pre-fetch reference table lookups for 'requests' table
      const floorMap = new Map<number, string>();
      const buildingMap = new Map<number, string>();
      const zoneMap = new Map<number, string>();
      const roomMap = new Map<number, string>();
      const subMap = new Map<number, string>();

      if (tablename.toLowerCase() === 'requests') {
        const [floorsRaw, buildingsRaw, zonesRaw, roomsRaw, subsRaw] = await Promise.all([
          this.executeQuery(`SELECT * FROM \`${dbName}\`.\`floors\``).catch(() => []),
          this.executeQuery(`SELECT * FROM \`${dbName}\`.\`buildings\``).catch(() => []),
          this.executeQuery(`SELECT * FROM \`${dbName}\`.\`zones\``).catch(() => []),
          this.executeQuery(`SELECT * FROM \`${dbName}\`.\`rooms\``).catch(() => []),
          this.executeQuery(`SELECT * FROM \`${dbName}\`.\`subcontractors\``).catch(() => []),
        ]);

        (floorsRaw || []).forEach((f: any) => {
          const id = Number(f.fl_id ?? f.id);
          const name = f.floor_name ?? f.name ?? f.description;
          if (!isNaN(id) && id > 0 && name) floorMap.set(id, String(name).trim());
        });

        (buildingsRaw || []).forEach((b: any) => {
          const id = Number(b.build_id ?? b.id);
          const name = b.building_name ?? b.name ?? b.description;
          if (!isNaN(id) && id > 0 && name) buildingMap.set(id, String(name).trim());
        });

        (zonesRaw || []).forEach((z: any) => {
          const id = Number(z.id ?? z.zone_id);
          const name = z.zone ?? z.zone_name ?? z.name;
          if (!isNaN(id) && id > 0 && name) zoneMap.set(id, String(name).trim());
        });

        (roomsRaw || []).forEach((r: any) => {
          const id = Number(r.room_id ?? r.id);
          const name = r.room_name ?? r.name ?? r.description;
          if (!isNaN(id) && id > 0 && name) roomMap.set(id, String(name).trim());
        });

        (subsRaw || []).forEach((s: any) => {
          const id = Number(s.id);
          const name = s.subContractorName ?? s.sub_contractor_name ?? s.company_name;
          if (!isNaN(id) && id > 0 && name) subMap.set(id, String(name).trim());
        });
      }

      const dataArray = (rows || []).map((row: any) => {
        const cleanRow = { ...row };

        if (tablename.toLowerCase() === 'requests') {
          // 1. Floor Name
          const floorId = Number(cleanRow.Floor_Id ?? cleanRow.floor_id ?? cleanRow.floorId);
          if (!isNaN(floorId) && floorMap.has(floorId)) {
            cleanRow.floor_name = floorMap.get(floorId);
          }

          // 2. Building Name
          const bldId = Number(cleanRow.Building_Id ?? cleanRow.building_id ?? cleanRow.buildingId);
          if (!isNaN(bldId) && buildingMap.has(bldId)) {
            cleanRow.building_name = buildingMap.get(bldId);
          }

          // 3. Subcontractor Name
          const subId = Number(cleanRow.Sub_Contractor_Id ?? cleanRow.sub_contractor_id ?? cleanRow.subContractorId);
          if (!isNaN(subId) && subMap.has(subId)) {
            cleanRow.subcontractor_name = subMap.get(subId);
          }

          // 4. Zone Name(s) from Zone_Id / Zone_Ids
          const rawZoneVal = cleanRow.Zone_Id ?? cleanRow.Zone_Ids ?? cleanRow.zone_id ?? cleanRow.zoneId;
          if (rawZoneVal !== undefined && rawZoneVal !== null && String(rawZoneVal).trim() !== '') {
            const parts = String(rawZoneVal).split(',').map((p) => p.trim()).filter(Boolean);
            const resolvedZones = parts.map((part) => {
              const num = Number(part);
              if (!isNaN(num) && zoneMap.has(num)) {
                return zoneMap.get(num)!;
              }
              return part;
            });
            cleanRow.zone_name = resolvedZones.join(', ');
            cleanRow.zone = resolvedZones.join(', ');
          }

          // 5. Room Name(s) from Room_Nos
          const rawRoomVal = cleanRow.Room_Nos ?? cleanRow.room_nos ?? cleanRow.roomNos;
          if (rawRoomVal !== undefined && rawRoomVal !== null && String(rawRoomVal).trim() !== '') {
            const parts = String(rawRoomVal).split(',').map((p) => p.trim()).filter(Boolean);
            const resolvedRooms = parts.map((part) => {
              const num = Number(part);
              if (!isNaN(num)) {
                if (roomMap.has(num)) return roomMap.get(num)!;
                if (zoneMap.has(num)) return zoneMap.get(num)!;
              }
              return part;
            });
            cleanRow.room_names = resolvedRooms.join(', ');
            cleanRow.room_name = resolvedRooms.join(', ');
          }

          if (cleanRow.PermitNo) {
            cleanRow.link = `https://api.beam.safesiteworks.com/${region}/requests/permit-design/${cleanRow.PermitNo}`;
          }
        }

        return cleanRow;
      });

      const pages = limit > 0 ? Math.ceil(totalRows / limit) : 1;

      return {
        status: 200,
        total: totalRows,
        page,
        limit,
        returned: dataArray.length,
        pages,
        [tablename]: dataArray,
      };
    } catch (err: any) {
      console.warn(`PowerBI query failed for ${region}.${tablename}: ${err.message}`);
      // Return empty array format as legacy fallback
      return {
        status: 200,
        total: 0,
        page,
        limit,
        returned: 0,
        pages: 1,
        [tablename]: [],
      };
    }
  }
}
